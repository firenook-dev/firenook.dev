---
name: firenook
description: Run, switch to and debug Firenook, the drop-in replacement for the Firebase Local Emulator Suite. Use when a project runs the Firebase emulators (firebase emulators:start or emulators:exec, connectFirestoreEmulator, FIRESTORE_EMULATOR_HOST) or already uses Firenook (firenook in package.json, a .firenook folder), to install it, swap the commands, keep data between runs, run tests against it, or call functions.
---

# Firenook

Firenook runs the Firebase emulators from one npm package with a native
engine: Firestore, Authentication, Cloud Storage, Cloud Functions,
Extensions, Pub/Sub, Cloud Tasks and Eventarc. It reads `firebase.json`,
`.firebaserc`, rules and indexes the way the Firebase CLI does, listens on
the same ports, and imports and exports the official format. It needs no
Java. It does not emulate Realtime Database, Hosting, App Hosting or Data
Connect; a `firebase.json` that configures them still starts, with a warning.

It needs Node 22, 24 or 26 on macOS, Linux with glibc 2.28 or newer, or
Windows x64.

## Install

```sh
npm install --save-dev firenook
```

Keep firebase-tools for deploying: Firenook has no deploy or login command.

## Switch a project from the Firebase emulators

1. Check the project. This prints a plan and changes nothing:

   ```sh
   npx firenook init --adopt --dry-run
   ```

   `error` lines would stop a start, `skip` lines are services Firenook does
   not emulate, and `add` lines are what `npx firenook init --adopt` adds.
   `npx firenook doctor` runs the same checks plus the engine and Node, and
   prints JSON with what would stop a start under `problems`.

2. Swap the commands in `package.json` scripts and CI:
   `firebase emulators:start` becomes `firenook emulators:start`, and
   `firebase emulators:exec` becomes `firenook emulators:exec`. `--only`,
   `--project`, `--import`, `--export-on-exit` and `--inspect-functions`
   carry over. The app needs no change: `connectFirestoreEmulator`,
   `FIRESTORE_EMULATOR_HOST` and the rest connect as before.

3. Optional: replace `--export-on-exit` with `--keep-data`. The first start
   imports `./data` into `.firenook/state`, later starts resume it, and
   `./data` is never written. Keep `--import ./data` in the command: data
   that began from a seed is refused without it.

Add `.firenook/` to `.gitignore`: it holds each run's working files and the
kept data.

## Commands

| Task | Command |
| --- | --- |
| Start the emulators | `npx firenook emulators:start` |
| Start and keep the data between runs | `npx firenook emulators:start --keep-data` |
| Run tests, then stop | `npx firenook emulators:exec "npm test"` |
| Compile TypeScript functions first | add `--build` to either command |
| Export the running data | `npx firenook emulators:export ./export` |
| Call a function | `npx firenook functions:invoke NAME --data '{"x":1}'` |
| Deliver a background event | `npx firenook functions:invoke NAME --event-data '{...}'` |
| Start a new project | `npx firenook init` |
| Give coding agents the emulators | `npx firenook mcp add` |

`emulators:exec` takes one quoted command, run through the shell, or a
command after `--`, started directly. It exits with the command's code, or 1
when the emulators could not start.

## Good to know

- The console replaces Google's Emulator UI on the UI port:
  `http://127.0.0.1:4000/console`.
- In pipes and CI the output is plain lines, and `All emulators ready` is on a
  line of its own once everything is up.
- Stop with `q` or Ctrl-C, or send `SIGINT` or `SIGTERM`. Firenook saves the
  data and closes its files before it exits.
- When a port is in use, the error names the program holding it. Never run
  Firenook and the official emulators on the same ports or in the same
  folder.
- `functions:shell` is `firenook functions:invoke`.

## The emulators from an agent

`npx firenook mcp add` writes Firenook's MCP server into the project files of
Claude Code (`.mcp.json`), Cursor (`.cursor/mcp.json`) and VS Code
(`.vscode/mcp.json`); other agents run `npx firenook mcp`. Its 54 tools read
the log and each function call with its error, ask the Security Rules why a
request is denied, and work with Firestore, Auth and Storage data on the
local emulators only.

## More

- Search and read the docs over MCP at `https://firenook.dev/docs/mcp`
  (`search_docs`, `read_page`, `list_pages`).
- Every docs page is Markdown at its address plus `.md`. The list of pages
  is `https://firenook.dev/llms.txt`.
- Troubleshooting: `https://firenook.dev/docs/help/troubleshooting.md`.
- CLI reference: `https://firenook.dev/docs/reference/cli.md`.
