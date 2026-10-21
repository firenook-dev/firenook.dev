---
title: Troubleshooting
description: The messages Firenook prints when something stops it, what each one means, and the fix, from the wrong Node to a seed that changed.
---

Find the message Firenook printed, then read what it means and how to fix it.
In a terminal, `emulators:start` shows a problem in a box with the fix in it;
pipes, CI and `--plain` print the same problem as one line. Both are shown
where they differ. The examples come from a project whose emulators used
ports from 31500 up, with its path shortened to `~/demo-shop`.

Firenook never deletes data to get past a problem: when it refuses to start,
your data stays as it was.

## The emulators need Node 24

```console
$ npx firenook emulators:start
Firenook: the emulators need Node 24, since your Functions run on it; this is Node 26.9.0. Switch to Node 24 (with nvm: nvm install 24) and run it again
```

Your functions run on the same Node as Firenook, and its Functions runtime is
tested on Node 24, so the emulators start only on Node 24. `emulators:start`,
`emulators:exec`, `doctor` and `ext:vendor` check it. `init`, `use`,
`--version` and the other commands run on any Node from 20 up.

Switch to Node 24 and run the command again:

```sh
nvm install 24
nvm use 24
```

## A port is already in use

```console
$ npx firenook emulators:start
├─ ✕ Firenook could not start ─────────────────────────────────────────────┤
│  Problem       port 31503 for Firestore is held by node (PID 24927)      │
│  Fix           stop it:  kill 24927                                      │
│                or give Firestore a free port in firebase.json:           │
│                "emulators": { "firestore": { "port": 31511 } }           │
│  Data          nothing of yours was changed                              │
╰──────────────────────────────────────────────────────────────────────────╯
```

The plain output says the same in one line. The number in brackets is the
operating system's error code, so it differs between macOS, Linux and
Windows:

```text
suite failed: cannot bind firestore at 127.0.0.1:31503: Address already in use (os error 48)
```

Another program listens on a port `firebase.json` gives an emulator. Often it
is an earlier run that is still going. When the screen can tell, it names the
holder: another Firenook, an official Firebase emulator, or the Firebase CLI's
emulators.

Stop that program with the command the screen gives (`kill <pid>`, or
`taskkill /PID <pid>` on Windows), or give the emulator another port in
`firebase.json`. The screen suggests a free one. If you change a port, change
it where your app connects too. Every emulator needs its own port; see
[ports](/docs/reference/ports).

## Missing @firenook/cli-…

```console
$ npx firenook emulators:start
Firenook: Missing @firenook/cli-darwin-arm64@0.2.0-next.8. Install with optional dependencies enabled. No postinstall script is needed.
```

The native engine for your machine comes in an optional dependency, one
package per platform. It was not installed, usually because optional
dependencies were turned off (`--omit=optional`, or `omit=optional` in
`.npmrc`). Install again with them on:

```sh
npm install --include=optional
```

Two related messages mean the platform package is there but does not match
the launcher, for example after a partial upgrade. Reinstall the exact
version in both cases:

```text
Firenook platform package identity mismatch; reinstall the pinned CLI and its optional dependencies.
Firenook binary checksum mismatch; refusing execution.
```

A machine with no engine package gets this instead. Firenook runs on macOS
(Apple silicon and Intel), Linux x64 and arm64 with glibc, and Windows x64;
Alpine and other musl-based Linux, and Windows on Arm, are not supported:

```text
Unsupported platform win32-arm64. Supported: darwin-arm64, darwin-x64, linux-x64, linux-arm64, win32-x64 (Linux requires glibc). No automatic build/download fallback.
```

## GLIBC_2.39 not found

On Linux, the engine needs glibc 2.39 or newer: Ubuntu 24.04 or later,
Debian 13 or later, Fedora 40 or later. On an older system the engine does
not load, and the system's dynamic loader prints a line that names the
missing version, in this form:

```text
…/libc.so.6: version `GLIBC_2.39' not found (required by …/bin/firenook)
```

Debian 12, which the `node:24` and `node:24-slim` Docker images are built on,
Ubuntu 22.04 and Amazon Linux 2023 have an older glibc and cannot run
Firenook 0.2.0-next.8. Move to a newer system or image, such as
`node:24-trixie-slim` (Debian 13). See [Docker](/docs/get-started/docker).

## Saved data needs --keep-data

```console
$ npx firenook emulators:start --state-dir .firenook/state
Firenook: Existing nonempty state requires explicit --resume-state (or --keep-data); never silently reimport or reset it
```

You named a state directory that already holds data, without saying to keep
using it. Firenook will not reset it or import over it. Add `--keep-data` to
pick the data up (it uses `.firenook/state`, or the `--state-dir` you give),
or name a new `--state-dir` to start fresh.

Saved data also remembers whether it began from a seed, and a start that
mixes the two up is refused. Data started without `--import` refuses a seed:

```text
suite failed: native state refused: this data was started without a seed, so it cannot take the seed ~/demo-shop/data: start without --import to keep using it; existing data preserved. Use a NEW --state-dir for an explicit fresh import; do not delete the previous directory.
```

Data started from a seed needs that seed at every start:

```text
suite failed: native state refused: it was imported from ~/demo-shop/data: pass --import ~/demo-shop/data to keep using it; existing data preserved. Use a NEW --state-dir for an explicit fresh import; do not delete the previous directory.
```

Start the way the data began, or import into a new `--state-dir`. See
[keep data between runs](/docs/data/keep-data).

## The seed changed after it was imported

```console
$ npx firenook emulators:start --keep-data --import ./data
├─ ✕ Firenook could not start ─────────────────────────────────────────────┤
│  Problem       the seed data changed after it was imported, so Firenook  │
│                will not pick up .firenook/state                          │
│  Changed       firebase-export-metadata.json  changed                    │
│  Fix           to import the changed seed, start with a new              │
│                --state-dir; this one stays as it is                      │
│                to keep this data with the seed as it is now:             │
│                firenook state:adopt-seed \                               │
│                  --state-dir .firenook/state \                           │
│                  --import data                                           │
│  Data          nothing was deleted: .firenook/state is untouched         │
╰──────────────────────────────────────────────────────────────────────────╯
```

Saved data records the seed it was imported from. When a file in the seed
changes, for example after a `git pull` brought a new export, the saved data
no longer matches it, and Firenook names the files that changed. Files the
operating system writes into folders, such as `.DS_Store` and `Thumbs.db`,
never count.

You have two ways on. To use the new seed, start with a new `--state-dir`.
To keep your saved data and accept the seed as it is now, stop the emulators
and run the command from the box:

```console
$ npx firenook state:adopt-seed --state-dir .firenook/state --import ./data
Recorded ~/demo-shop/data as the seed of ~/demo-shop/.firenook/state (7 files).
The saved data is as it was; the previous receipt is at ~/demo-shop/.firenook/state/native-state.json.before-adopt-1792596487.
```

## Suite state is locked

```console
$ npx firenook emulators:start --keep-data
├─ ✕ Firenook could not start ─────────────────────────────────────────────┤
│  Problem       suite state is locked: lock acquisition failed because    │
│                the operation would block, so Firenook will not pick up   │
│                .firenook/state                                           │
│  Fix           another Firenook is using .firenook/state: stop it        │
│                first, or start this one with another --state-dir         │
│  Data          nothing was deleted: .firenook/state is untouched         │
╰──────────────────────────────────────────────────────────────────────────╯
```

Another Firenook has the same saved data open, for example in a second
terminal, or with a second `firebase.json` in the same folder. Only one run
can use a state directory at a time. Stop the other run, or give this one
its own `--state-dir`.

## Firenook did not finish stopping

```console
├─ ✕ Firenook did not finish stopping ──────────────────── signal SIGKILL ─┤
│  Data          the next start checks .firenook/state first, and repairs  │
│                it if it needs to                                         │
╰──────────────────────────────────────────────────────────────────────────╯
```

In the plain output:

```text
firenook: the engine was ended (SIGKILL) before it finished stopping; the next start checks the data first, and repairs it if it needs to
```

You asked Firenook to stop, and something ended the engine before it closed
the data: `kill -9`, a task manager, or a tool that ends a whole process tree
when you stop it. Killing the engine loses no write it had acknowledged; the
data only needs checking. Start again and let that start finish; a repair
shows its progress. Next time, stop with `q` or Ctrl-C and wait for the
stopped line. See [recovery after a crash](/docs/data/recovery).

## Your functions did not load

```text
firenook functions: Failed to load function definition from source: FirebaseError: Failed to find location of Firebase Functions SDK for ~/demo-shop/functions. Install firebase-functions in the codebase.
suite failed: Functions runtime discovered 0 functions; at least 1 required
```

`firebase.json` configures a Functions codebase, but no function loaded. The
first line says why. Two causes are common:

- **The codebase's dependencies are not installed.** Firenook loads your
  functions with the `firebase-functions` SDK in the codebase's own
  `node_modules`. Run `npm install` in the `functions` folder.
- **The code throws when it loads.** The error and the line come with it, for
  example `SyntaxError: Unexpected token ')'` at `functions/index.js:9`.
  Fix the code and start again.

By default a configured codebase must load at least one function, so the
start stops. To start the other emulators anyway, pass
`--minimum-functions 0`. The terminal then shows the error in a card, keeps
everything else running, and loads the code again when you save:

```text
├─ ✕ Your functions did not load ──────────────────────────────────────────┤
│  Error         SyntaxError: Unexpected token ')'                         │
│  Where         functions/index.js:9                                      │
│                exports.broken = ) ;                                      │
│                                 ^                                        │
│  Next          fix it and save: Firenook loads it again by itself.       │
│                every emulator keep running                               │
├─ ! All emulators ready, except your functions ───────────────────────────┤
```

## Extensions need a Firebase login

An Extension from the registry is fetched once, on its first start, with the
Firebase CLI's login. Without a login, that first fetch fails:

```text
suite failed: Extensions failed to load: Failed to query the extension version 'firebase/firestore-send-email@0.1.34': HTTP Error: 401, Request is missing required authentication credential. Expected OAuth 2 access token, login cookie or other valid authentication credential. See https://developers.google.com/identity/sign-in/web/devconsole-project.
```

With `--offline`, or `FIRENOOK_OFFLINE=1`, Firenook does not try the
registry and says what is missing:

```text
suite failed: Extensions failed to load: firebase/firestore-send-email@0.1.34 is not vendored under ~/demo-shop/extensions/.sources/firebase/firestore-send-email@0.1.34 and not in the cache at ~/.cache/firebase/extensions/firebase/firestore-send-email@0.1.34; run `firenook ext:vendor` with network access
```

Log in once with the Firebase CLI (`firebase login`) or set `FIREBASE_TOKEN`,
then copy the Extension into the project:

```sh
npx firenook ext:vendor
```

Commit `extensions/.sources`. From then on, every start on every machine
loads the Extension from the project, with no login and no network.
`npx firenook doctor` lists each Extension and whether it starts offline.

Each Extension instance also needs its parameters in
`extensions/<instance>.env`. Without the file the start stops with
`No params file found for send-email`. See
[without a Google login](/docs/help/no-login) and
[Extensions](/docs/services/extensions).

## Rules that do not compile

At start, rules that do not compile stop the start, with the file, line and
column:

```text
suite failed: invalid Firestore rules for database "(default)" in ~/demo-shop/firestore.rules: 15:26: expected "if"
```

While the emulators run, Firenook loads rules again when you save the file. A
save that does not compile is reported and the rules already loaded stay in
force:

```text
firenook firestore: database "(default)" rules in ~/demo-shop/firestore.rules did not compile; the rules in force are unchanged: 15:26: expected "if"
firenook storage: rules for every bucket in ~/demo-shop/storage.rules did not compile; the rules in force are unchanged: 13:1: expected end of rules source
```

Fix the line named and save again.

## Requests denied by the rules

A request the rules deny fails with `PERMISSION_DENIED`. Over Firestore's
REST API the answer is:

```json
{"error":{"code":403,"message":"Security Rules denied the request","status":"PERMISSION_DENIED"}}
```

To see why, open the console's Firestore Rules page: it lists the recent
requests with each decision. A coding agent can ask through the MCP tools:
`rules_evaluate` says whether a request as a given user would be allowed and
which rule line decided, and `rules_list_denials` lists recent denials. The
Rules page and `rules_list_denials` read the requests Firenook records by
default; `--no-diagnostics` turns that recording off.

The rules `firenook init` writes allow every request until a date 30 days
after you ran it (`request.time < timestamp.date(…)`), and deny every request
after that. Replace them with your own rules before then.

## The console does not answer for a host name

```json
{"error":{"code":"permission-denied","fix":"Start the engine with --allowed-hosts shop.local if you meant to.","message":"This console does not answer for host shop.local."}}
```

The console can change and delete everything the emulators hold, so it
answers only for names that mean your own machine: `localhost`, `127.0.0.1`,
`::1`, any name under `localhost` (such as `my-app.localhost`), and the
`--host` address. Started with `--host 0.0.0.0` and no `--allowed-hosts`, it
answers any name.

To reach it through a proxy, a tunnel or a `.local` name, add the name:

```sh
npx firenook emulators:start --allowed-hosts shop.local
```

## A command reaches the wrong emulators

`emulators:export`, `functions:invoke`, `firestore:delete` and `mcp` find the
running emulators through a file named after the project id,
`hub-<project>.json` in the system's temporary folder, as the official CLI
does. Two runs with the same project id share that file, so these commands
reach the run that started last, even when your `firebase.json` names other
ports:

```console
$ npx firenook emulators:export ./snap
Found running emulator hub for project demo-shop at http://127.0.0.1:31308; exporting firestore, auth, storage to ~/demo-shop/snap
```

Here the project's own `firebase.json` puts the hub on port 31501, and the
command found another run's hub on 31308. To run two copies of a project at
once, such as two Git worktrees, give each its own ports and its own project
id (`--project demo-shop-feature`).

## Other messages

| Message | What to do |
| --- | --- |
| `No firebase.json at ~/demo-shop/firebase.json; run firenook init in the project directory or pass --config` | Run the command in the project folder, pass `--config`, or create a project with `npx firenook init`. |
| `No project id. Pass --project <id> (or -P <id>), or record one with firenook use --add <id> (projects.default in .firebaserc).` | Pass `--project demo-shop`, or record a default with `npx firenook use --add demo-shop`. |
| `Invalid project id My_Shop: use lowercase letters, digits and hyphens (6 to 30 characters, starting with a letter), or a demo- prefix for a local-only project.` | Use a valid id. A `demo-` id never reaches a real project. |
| `No emulators to start, run firenook init to get started.` | `firebase.json` configures no emulator. Add an `emulators` entry, or run `npx firenook init --adopt`. |
| `The database emulator is not implemented by Firenook (roadmap); remove it from --only.` | Realtime Database, Hosting, App Hosting and Data Connect are not emulated. Remove them from `--only`. |
| `Unexpected argument npm; firenook emulators:start takes options only (test commands belong to emulators:exec).` | Run a test command with `emulators:exec`. |
| `emulators:exec received 2 arguments without --; run: firenook emulators:exec --only firestore -- npm test` | Quote the command (`"npm test"`) or put it after `--`, as the message shows. |
| `Unsupported command deploy; use --help. Firebase deploy/login commands are never intercepted.` | Firenook only emulates. Deploy and log in with firebase-tools. |
| `Did not find a running emulator hub for project demo-proj (tried http://127.0.0.1:31501): ECONNREFUSED. Start it with firenook emulators:start.` | `emulators:export`, `functions:invoke` and `firestore:delete` work on running emulators. Start them first. |

## Next

Still stuck? [Report the problem](/docs/help/report) with the details that
help it get fixed.
