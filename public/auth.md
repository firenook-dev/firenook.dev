# firenook.dev auth.md

firenook.dev needs no account, no registration and no credentials. Every
page, the docs as Markdown, llms.txt and the docs' MCP server are public, and
an agent uses them as they are, on behalf of anyone.

## Registration

None. There is nothing to sign up for, and no endpoint creates an account.

## Signing in

None. No address on firenook.dev asks for a token, an API key or a cookie,
and none sets one.

## What an agent can use

- The docs' MCP server, `https://firenook.dev/docs/mcp`, over Streamable
  HTTP, with no `Authorization` header. Its card is at
  `https://firenook.dev/docs/mcp/server-card`.
- Every page as Markdown: its address plus `.md`, or the page's address with
  `Accept: text/markdown`.
- The list of pages, `https://firenook.dev/llms.txt`, and the Firenook skill,
  `https://firenook.dev/.well-known/agent-skills/firenook/SKILL.md`.

## Firenook itself

Firenook runs the Firebase emulators on your own machine, and it has no
account either. Its Authentication emulator's test users and tokens are
described at `https://firenook.dev/docs/services/auth`.

## Security

How to report a vulnerability: `https://firenook.dev/security`.
