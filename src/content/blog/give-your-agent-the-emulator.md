---
title: Give your coding agent the emulator, not production
description: "Firenook's MCP server gives a coding agent 54 tools over the local Firebase emulators: data, users, files, function calls, logs and Security Rules."
date: 2026-10-21
---

A coding agent working on a Firebase app needs data, function calls and rules
to look at before it can help. This post shows how to give it the local
emulators instead of production, with `firenook mcp`: what the tools do, how
to set them up, a real session, and what stays on your machine.

## The problem

Ask an agent why a function fails, and it has two ways to answer. It can read
the code and guess, which gets you a confident answer about a request it
never saw. Or it can look for credentials, a service account key or a
logged-in CLI, and query production. That puts your customers' data in a
prompt and lets an agent write where your real users are.

The emulators already hold what the agent needs: data in the shape your app
writes it, the request that failed with its stack trace, the rule that denied
a write. What is missing is a way for the agent to ask them.

## What firenook mcp serves

`firenook mcp` is a Model Context Protocol server over stdio, part of the
Firenook package, with no dependencies of its own. It reads `firebase.json`
and `.firebaserc` from the folder the agent starts it in, so it needs no
project id. It finds the running suite again on every call, so you can
restart the emulators without restarting the agent.

It serves 54 tools, in groups:

| Group | Tools | What the agent can do |
| --- | ---: | --- |
| Status | 2 | See how the project was found and which emulators run; export the data |
| Firestore | 6 | Get, query, count, write and delete documents; list collections |
| Auth | 13 | Create, list and delete users; read the email and SMS codes; mint ID tokens; set claims; disable users; list tenants |
| Storage | 7 | List, read, upload, copy, move and delete files; read metadata |
| Functions | 5 | List and invoke functions; read each call with its request, error and stack trace; replay a call |
| Logs | 2 | Search the suite's log by service, level, function, call, text and time |
| Rules | 3 | Read the rules in force; ask whether a request would be allowed and which line decided; list recent denials |
| Pub/Sub | 4 | Publish; list topics and subscriptions; peek at a backlog without acknowledging it |
| Tasks and schedules | 5 | Read queue statistics and tasks; run a task or a schedule now |
| Eventarc and Extensions | 6 | Publish, list and replay events; list and reload Extensions instances |
| Reset | 1 | Clear the data of the services you choose |

`firenook mcp --only firestore,auth` serves a subset; the two status tools
are always there. [The tool reference](/docs/reference/mcp-tools) lists every
tool with its arguments.

## Set it up

From the project folder, with Firenook installed in the project:

```sh
npx firenook mcp add
```

It looks for Claude Code (a `.claude/` folder, `CLAUDE.md`, an `.mcp.json`
or `claude` on the PATH), Cursor (`.cursor/`) and VS Code (`.vscode/`), and
writes each one's project file. In our demo project:

```console
$ npx firenook mcp add
Firenook mcp add: ~/demo-shop
  add     .mcp.json (Claude Code)
  add     .cursor/mcp.json (Cursor)
  add     .vscode/mcp.json (VS Code)
  Codex: codex mcp add firenook -- npx firenook mcp
Commit these files so every teammate's agent has the server; restart the agent to load it.
```

Each file gets one entry that runs `npx firenook mcp`:

```json title=".mcp.json"
{
  "mcpServers": {
    "firenook": {
      "command": "npx",
      "args": [
        "firenook",
        "mcp"
      ]
    }
  }
}
```

VS Code's `.vscode/mcp.json` names the same entry under `servers`, with
`"type": "stdio"`. Other servers in those files are kept, and a second run
changes nothing: it prints `keep` for each file that is already set.
`--dry-run` shows what it would write, `--agent cursor,vscode` picks the
agents, and `--force` replaces another `firenook` entry. An agent configured
only in your home folder, such as Codex above, gets the line to run, and no
file outside the project is edited.

Start the emulators as usual with `npx firenook emulators:start`, then
restart the agent so it loads the server.

## A session

The home page shows an agent answering a question about the demo shop: eight
products, twelve customers, twelve orders through its `checkout` function,
and one webhook sent without a signature. The question is an example; the
tool calls and the answers are from a run of the demo project, trimmed.

> The Stripe webhook answers 500 on my machine. Why?

The agent calls `functions_list_calls` with `{"outcome": "failed"}`:

```json
{
  "total": 1,
  "calls": [
    {
      "id": "e72ca3-25",
      "function": "us-central1-stripeWebhook",
      "kind": "http",
      "summary": "POST /",
      "durationMs": 1.15,
      "outcome": "failed",
      "status": 500
    }
  ]
}
```

Then `functions_get_call` with that id, for the call in full:

```json
{
  "error": "Unhandled error Error: No signatures found matching the expected signature for payload",
  "stack": "Unhandled error Error: No signatures found …\n    at functions/index.js:24:11\n    …",
  "request": {
    "method": "POST",
    "path": "/",
    "headers": {
      "host": "127.0.0.1:5001",
      "connection": "keep-alive",
      "content-type": "application/json",
      "accept": "*/*",
      "accept-language": "*",
      "sec-fetch-mode": "cors",
      "user-agent": "node",
      "accept-encoding": "gzip, deflate",
      "content-length": "37"
    },
    "body": { "type": "checkout.session.completed" }
  },
  "response": { "status": 500, "body": "Internal Server Error" }
}
```

The answer is in the request: it carries no `stripe-signature` header, and
line 24 of `functions/index.js` throws when the header is missing. The agent
found it without touching production.

We ran a second session on the same project for this post, about rules. Its
Storage rules deny everything, and the question is whether a signed-in
customer can upload a product photo. The agent calls `rules_evaluate` for a
`create` of `products/mug.jpg` as the customer's uid, with a 48,000-byte JPEG:

```json
{
  "as": { "uid": "a6oK9eDRtwAa9RTryMc2ZTjEjKTm", "claims": {} },
  "allowed": false,
  "outcome": "deny",
  "decidedBy": [
    { "line": 9, "text": "allow read, write: if false;", "outcome": "deny" }
  ]
}
```

It drafts a rule and passes it as `source`, which evaluates the draft instead
of the rules in force:

```txt title="storage.rules (draft)"
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{file} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

The same request is now allowed, with the line that decided and the value of
every expression on the way:

```json
{
  "draft": true,
  "allowed": true,
  "outcome": "allow",
  "decidedBy": [
    { "line": 6, "text": "allow write: if request.auth != null", "outcome": "allow" }
  ],
  "steps": [
    { "line": 6, "expression": "request.auth != null", "value": "true" },
    { "line": 7, "expression": "request.resource.contentType.matches('image/.*')", "value": "true" },
    { "line": 8, "expression": "request.resource.size < 5 * 1024 * 1024", "value": "true" }
  ]
}
```

Without a uid, the same draft denies the request at line 6, where
`request.auth` is `null`. Nothing was written: your `storage.rules` stays as
it is until you accept the change. In this session, every tool answered in
0.8 to 18 ms.

Destructive tools keep the console's safeguard. Asked to clear Firestore and
Auth at once, `emulators_clear` refuses until the agent names the project:

```json
{
  "error": "Clearing 2 services (firestore, auth) deletes all their data; to confirm, pass confirmProject: \"demo-shop\" (the project id)"
}
```

## What stays on your machine

- The server holds no credentials and contacts no cloud service. Every
  request goes to the emulators, at the addresses the hub or `firebase.json`
  gives.
- It calls the emulators with the owner token the Admin SDK uses, so its
  reads and writes skip Security Rules, as the Admin SDK's do. To ask about
  rules, the agent uses `rules_evaluate`, which writes nothing.
- Each request carries an `x-firenook-client: firenook-mcp/<version>`
  header, and after each call the server tells the console which tool ran,
  so the console's Connect dialog can show when an agent last called.
  Nothing else is recorded.
- A `demo-` project id never reaches a real Firebase project. With a real
  project id the suite still contacts nothing, but your own function code can
  reach the real project if it holds credentials: Firenook is not a network
  sandbox.

The server gives the agent a better place to look, not a cage: an agent with
a shell can still run what it likes. Treat what an agent writes through the
server as you would any emulator data, synthetic only.

Read [how agents use Firenook](/mcp) for an overview, and
[Connect your coding agent](/docs/tools/mcp) for the setup of each agent.
