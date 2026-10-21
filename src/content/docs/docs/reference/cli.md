---
title: CLI commands
description: Every firenook command and flag in 0.2.0-next.8, grouped as firenook --help groups them, with what each does and its default.
---

Every command the `firenook` executable takes, grouped as `firenook --help`
groups them. Run them through your package manager (`npx firenook ...`,
`bunx firenook ...`) or from your package scripts.

```console
$ npx firenook --version
0.2.0-next.8 (engine source f7c3c663427fd181b0e67b31f960f6e5751b7d12)
```

`firenook --help`, `-h` or `help` prints one help text for every command,
and so does `--help` after a command. `--version` or `-v` prints the
release and the engine revision it was built from.

## How options work

- Long options take their value as `--name value` or `--name=value`. The
  short forms are `-P` (`--project`), `-c` (`--config`), `-r`
  (`--recursive`), `-f` (`--force`) and `-h` (`--help`).
- No option is ever ignored. An unknown option, an option the command does
  not take, a value given to a switch or an option given twice is an error,
  and the command exits with code 1:

  ```console
  $ npx firenook emulators:start --auth-port 9100
  Firenook: Unsupported option --auth-port; no option is silently ignored.
  $ npx firenook emulators:export ./out --instance x
  Firenook: --instance is not an option of firenook emulators:export; see --help
  ```

- Firenook never asks for confirmation. Commands that delete need
  `--force`. The one question it asks is in `init`, in a terminal, whether
  to give your coding agents the MCP server.

## Project

### init

```sh
firenook init [--project ID] [--no-functions] [--dry-run] [--force] [--json]
```

Sets up a new project in the current folder. It writes `firebase.json`
with every emulator on its usual port, `.firebaserc`, the default Firestore
and Storage rules and indexes, and a JavaScript Functions codebase in
`functions/`, and adds `.firenook/` and `*-debug.log` to `.gitignore`. It
installs nothing. It refuses to overwrite an existing `firebase.json`
unless you pass `--force`, and points you to `init --adopt` instead.

```console
$ npx firenook init
Firenook init: project demo-shop in ~/demo-shop
  wrote   ~/demo-shop/firebase.json
  wrote   ~/demo-shop/.firebaserc
  wrote   ~/demo-shop/firestore.rules
  wrote   ~/demo-shop/firestore.indexes.json
  wrote   ~/demo-shop/storage.rules
  wrote   ~/demo-shop/functions/package.json
  wrote   ~/demo-shop/functions/index.js
  wrote   ~/demo-shop/functions/.gitignore
  wrote   ~/demo-shop/.gitignore
Next steps:
  cd functions && npm install
  firenook emulators:start --project demo-shop --keep-data
  firenook mcp add   (gives Claude Code the Firenook MCP server)
```

In a terminal, when the folder shows a coding agent, `init` asks once
whether to give it the [MCP server](/docs/tools/mcp) instead of printing the
last step.

| Option | Does | Default |
| --- | --- | --- |
| `--project ID`, `-P ID` | The project id to record in `.firebaserc` | The id already in `.firebaserc`, else the folder's name with `demo-` in front |
| `--no-functions` | Leaves out the Functions codebase, and the Functions, Eventarc and Cloud Tasks emulators | A codebase is written |
| `--dry-run` | Prints what it would write, and writes nothing | |
| `--force` | Overwrites `firebase.json` and the files it would otherwise keep | Existing files are kept |
| `--json` | Prints the plan as one line of JSON instead of the list | |

### init --adopt

```sh
firenook init --adopt [--dry-run] [--json]
```

Checks an existing project the way the emulators will read it and prints a
plan: errors Firenook cannot accept, configured services it skips, and the
additions it can make. Additions are a missing `emulators` entry for a
configured service, a missing `.firebaserc` default, a rules file that is
referenced but missing, and the MCP server for the coding agents the folder
shows. Without `--dry-run` it applies the additions by editing the parsed
JSON, never rewriting your other keys. When there are errors it changes
nothing and exits 1.

```console
$ npx firenook init --adopt --dry-run
Firenook init --adopt: ~/demo-shop/firebase.json
  skip    Firenook: firebase.json configures the database emulator, which Firenook does not implement; skipping it.
  add     set .firebaserc projects.default = demo-shop (create the file)
  add     give Claude Code the Firenook MCP server: ~/demo-shop/.mcp.json
Dry run: nothing was written.
```

### use

```sh
firenook use [alias|projectId]
firenook use --add ID [--alias NAME]
firenook use --unalias NAME
firenook use --clear
```

Edits the project aliases in `.firebaserc`, as `firebase use` does, with no
network and no login. On its own it lists the aliases and the active
project. With an alias or a project id it makes that the active project
(`projects.default`). `--add` records a project under `--alias`, or as the
default when you give no alias. `--unalias` removes an alias, and `--clear`
removes the active project.

```console
$ npx firenook use --add demo-shop --alias dev
Created alias dev for demo-shop in ~/demo-shop/.firebaserc.
$ npx firenook use dev
Now using alias dev (demo-shop)
```

### target:apply and target:clear

```sh
firenook target:apply storage NAME BUCKET...
firenook target:clear storage NAME
```

Map a Storage target to one or more buckets in `.firebaserc`, or remove
the mapping, for a `firebase.json` whose `storage` section is a list of
`{target, rules}` entries. Only `storage` targets exist; `hosting` and
`database` are refused.

```console
$ npx firenook target:apply storage main demo-shop.appspot.com
Applied storage target main to demo-shop.appspot.com for demo-shop
Updated: main (demo-shop.appspot.com)
```

### setup

```sh
firenook setup
```

Does nothing, and succeeds, so scripts that still run it keep working.
Until 0.2.0-next.3 it downloaded Google's Emulator UI; the console is now
part of the engine.

```console
$ npx firenook setup
Nothing to set up: the console is part of the engine, and Firenook downloads nothing.
```

### doctor

```sh
firenook doctor [options]
```

Runs the checks `emulators:start` would run, changes nothing, and prints
the result as JSON: the engine binary it found, how it reads
`firebase.json` and `.firebaserc` (project, services, ports, host, data
folder), the warnings, which Extensions can start offline, and the version.
It takes the same options as `emulators:start`, plus `--instance`. A
configuration error is printed as an error and exits 1. Like the emulators,
it needs Node 24.

## Emulators

### emulators:start

```sh
firenook emulators:start [options]
```

Starts every emulator `firebase.json` configures and runs until you stop
it. In a terminal it draws [its own screen](/docs/tools/terminal);
elsewhere it prints plain lines. It takes the
[start and exec options](#start-and-exec-options) below. It takes no
command: a test command belongs to `emulators:exec`.

### emulators:exec

```sh
firenook emulators:exec [options] "npm test"
firenook emulators:exec [options] -- CMD [ARGS...]
```

Starts the emulators, runs your command once they are ready, then stops
them, saving or exporting as asked, and exits with your command's exit
code. One quoted string runs through the shell, as the official CLI does.
After `--`, the command and its arguments run directly, with no shell.

```console
$ npx firenook emulators:exec "npm test"
Firenook: running the script through the shell as the official CLI does; use -- for an argv command without shell interpretation
```

The command gets the emulators' addresses in its environment, listed in
[Configuration](/docs/reference/configuration#variables-firenook-sets). The
console stays off unless you pass `--ui` or `firebase.json` sets
`emulators.ui.enabled: true`, and the output is always plain lines. See
[Run your tests](/docs/get-started/tests).

### emulators:export

```sh
firenook emulators:export DIR [--only firestore,auth,storage] [--force] [--json]
```

Exports the running suite's Firestore, Auth and Storage data to `DIR` in the
official export format, which `--import` reads. It finds the suite the way
the official CLI does, through `hub-<project>.json` in the system's
temporary folder, then through the hub port in `firebase.json`.

```console
$ npx firenook emulators:export ../demo-shop-export
Found running emulator hub for project demo-shop at http://127.0.0.1:31440; exporting firestore, auth, storage to ~/demo-shop-export
Export complete: ~/demo-shop-export
```

| Option | Does | Default |
| --- | --- | --- |
| `--only` | Exports only these of `firestore`, `auth`, `storage` | Every one that runs |
| `--force` | Writes into a folder that is not empty and holds no earlier export | Refused; an earlier export is replaced |
| `--json` | Prints the result as JSON | |
| `--hub-port N` | Looks for the hub on this port when no locator file names it | `emulators.hub.port`, else 4400 |

The destination may not be the project folder, the current folder or a
folder above either.

### firestore:delete

```sh
firenook firestore:delete PATH (-r | --shallow) [-f] [--database ID]
firenook firestore:delete --all-collections -f [--database ID]
```

Deletes data in the running Firestore emulator. A document path deletes the
document, and with `-r` its subcollections too. A collection path needs
`-r` (everything beneath it) or `--shallow` (its documents only).
`--all-collections` clears the database. `-r` on a collection and
`--all-collections` need `--force`:

```console
$ npx firenook firestore:delete orders
Firenook: Must pass recursive or shallow option when deleting a collection.
$ npx firenook firestore:delete orders -r
Firenook: Refusing to recursively delete the collection orders of demo-shop without --force. Re-run: firenook firestore:delete orders -r --force
$ npx firenook firestore:delete orders -r --force --json
{"path":"orders","mode":"recursive","deleted":1}
```

| Option | Does | Default |
| --- | --- | --- |
| `-r`, `--recursive` | Also deletes everything beneath the path | |
| `--shallow` | Deletes a collection's documents, not their subcollections | |
| `--all-collections` | Deletes every collection of the database | |
| `-f`, `--force` | Confirms a recursive or whole-database delete | |
| `--database ID` | The Firestore database | `(default)` |
| `--json` | Prints the result as JSON | |
| `--hub-port N` | As for `emulators:export` | |

### functions:invoke

```sh
firenook functions:invoke NAME [--data JSON] [--region R] [--method M]
firenook functions:invoke NAME --event-data JSON [--resource PATH] [--params JSON] [--auth JSON] [--event-type T]
```

Calls a function on the running suite. It replaces the official
`functions:shell`: without `--event-data` it sends an HTTPS or callable
request; with it, it delivers a background event shaped as the official
shell builds it, for Firestore, Storage, Pub/Sub, Auth, schedule, Eventarc
and task-queue triggers. Pub/Sub and task-queue events go through their
emulators, as they would in production.

```console
$ npx firenook functions:invoke helloWorld --method GET
200 OK http://127.0.0.1:31401/demo-shop/us-central1/helloWorld
Hello from Firebase!
$ npx firenook functions:invoke onOrderCreated --event-data '{"total":1}' --params '{"id":"C3"}'
Firenook: firestore event google.cloud.firestore.document.v1.created for onOrderCreated (us-central1, gcfv2) via trigger key us-central1-onOrderCreated-0
200 OK http://127.0.0.1:31401/functions/projects/demo-shop/triggers/us-central1-onOrderCreated-0
{"status":"acknowledged"}
```

| Option | Does | Default |
| --- | --- | --- |
| `--data JSON` | Sends `{"data": <JSON>}` as a JSON request body, the shape a callable function reads | No body |
| `--method M` | The HTTP method, for an HTTPS function | `POST` |
| `--region R` | The region, when the name is deployed in several | `us-central1` |
| `--event-data JSON` | Sends a background event with this payload instead of a request | |
| `--resource PATH` | The event's resource, such as a Firestore document path | |
| `--params JSON` | Values for the trigger's wildcards, such as `{"id":"C3"}` | |
| `--auth JSON` | `{"uid": ..., "token": ...}` or `{"admin": true}` for first-generation events | |
| `--event-type T` | The CloudEvent type, for an Eventarc custom event | The trigger's |
| `--hub-port N` | As for `emulators:export` | |

The same call is the `functions_invoke` tool of the MCP server, and the
console's Functions page can call a function as any user.

### ext:vendor

```sh
firenook ext:vendor [--instance ID]...
```

Copies the registry Extensions that `firebase.json` names into the project,
under `extensions/.sources`, with their registry metadata. Later starts
then need no network and no Firebase login. `--instance` vendors only the
instances you name, and can be repeated. See
[Extensions](/docs/services/extensions).

### mcp

```sh
firenook mcp [--project ID] [--config PATH] [--only GROUPS]
```

Serves the running suite to a coding agent as an MCP server over stdio.
`--only` takes tool groups (`firestore`, `auth`, `storage`, `functions`,
`logs`, `rules`, `pubsub`, `tasks`, `schedules`, `eventarc`, `extensions`,
`reset`). See [Connect your coding agent](/docs/tools/mcp) and
[MCP tools](/docs/reference/mcp-tools).

### mcp add

```sh
firenook mcp add [--agent claude,cursor,vscode] [--dry-run] [--force] [--json]
```

Writes the `firenook mcp` server into the project files of your coding
agents: `.mcp.json`, `.cursor/mcp.json` and `.vscode/mcp.json`. See
[Connect your coding agent](/docs/tools/mcp#set-it-up).

## Saved data

These work on the data `--keep-data` keeps (or a `--state-dir` used with
`--resume-state`). Stop the emulators first. See
[Inspect and compact](/docs/data/inspect).

### state:adopt-seed

```sh
firenook state:adopt-seed --state-dir DIR --import SEED
```

Keeps saved data whose seed changed after it was imported: it records the
seed as it is now as the one the data came from, and keeps the old record.
Pass the same `--state-dir` and `--import` you start with.

### state:inspect

```sh
firenook state:inspect --state-dir DIR
```

Reads the saved Firestore file once and prints what it holds, table by
table, and how much of it is free:

```console
$ npx firenook state:inspect --state-dir .firenook/state
Reading every page of the Firestore file once (minutes for tens of gigabytes)…
~/demo-shop/.firenook/state/firestore/firenook.redb: 573 KB

  Documents                           1   74 B of keys and values in 4 KB of pages
  Field index                         1   20 B of keys and values in 4 KB of pages
  Field index names                   2   53 B of keys and values in 4 KB of pages
  Collection index                    1   76 B of keys and values in 4 KB of pages
  Collection-group index              1   85 B of keys and values in 4 KB of pages
  Store metadata                      5   119 B of keys and values in 4 KB of pages
  Old documents table                 0   0 B of keys and values in 0 B of pages
  Free pages, redb's own                  549 KB
```

### state:compact

```sh
firenook state:compact --state-dir DIR [--no-copy]
```

Returns the Firestore file's free pages to the disk. Every document stays
as it is. It copies the file first, unless you pass `--no-copy`.

## Advanced

### binary-path

```sh
firenook binary-path
```

Prints where the verified native engine for your machine is installed.

### native

```sh
firenook native ARGS...
```

Runs the native engine's own command line directly. It skips the
launcher's checks and safeguards for the project, the data and
credentials, so prefer the commands above.

## Common options

Every command above takes these, where they apply.

| Option | Does |
| --- | --- |
| `-P ID`, `--project ID` | The project id or alias. Default: `projects.default` in `.firebaserc`. |
| `-c PATH`, `--config PATH` | The `firebase.json` to read. Default: `firebase.json` in the current folder. |
| `--json` | Prints the result as JSON (`doctor` always does; `init`, `emulators:export`, `firestore:delete` and `mcp add` on request). |
| `--debug` | Writes every log record of the run to `.firenook/runs/session-*/firenook-debug.log`. The plain output prints the path, and the run's `launch.json` records it. |
| `--log-verbosity LEVEL` | `DEBUG`, `INFO`, `QUIET`, `SILENT`, `WARN` or `ERROR`. `DEBUG` works as `--debug`; the others are accepted for compatibility, and Firenook prints its full log. |
| `--non-interactive` | Accepted for compatibility. It also stops `init` asking its question. |
| `-h`, `--help` | Prints the help. |

## Start and exec options

`emulators:start`, `emulators:exec` and `doctor` take these.

| Option | Does | Default |
| --- | --- | --- |
| `--only NAMES` | Starts only these emulators, by the official names: `auth`, `functions`, `firestore`, `storage`, `pubsub`. `extensions` means `functions`; `eventarc`, `tasks`, `hub`, `ui` and `logging` follow their parent. `database`, `hosting`, `dataconnect` and `apphosting` are refused. | Every configured emulator |
| `--import DIR` | Imports an export (Firestore, Auth, Storage) at start. With `--keep-data`, only on the first start. | |
| `--export-on-exit[=DIR]` | Exports when the emulators stop, to `DIR` or back to the `--import` folder. | |
| `--keep-data` | Keeps the data between runs in `.firenook/state`. Needs Firestore, Auth and Storage running. See [Keep data between runs](/docs/data/keep-data). | A new, empty folder for every run |
| `--state-dir DIR` | Keeps the run's data in `DIR`. A folder that already holds data needs `--resume-state` or `--keep-data`. | `.firenook/runs/session-*/state` |
| `--resume-state` | Picks up the data in `--state-dir`. | |
| `--durability MODE` | `write-behind` confirms a write once it is in the journal and syncs every second and at shutdown; `per-commit` syncs every write before confirming it. | `write-behind` |
| `--storage-bucket TARGET=BUCKET` | Maps a Storage target to a bucket for this run. Repeatable. | `.firebaserc` targets |
| `--host HOST` | The address every emulator listens on. See [Ports](/docs/reference/ports#host). | `127.0.0.1` |
| `--allowed-hosts NAMES` | More host names the console answers for, comma-separated. See [The console](/docs/tools/console#reach-it-by-another-name). | |
| `--ui` | Keeps the console on for `emulators:exec`. It cannot override `emulators.ui.enabled: false`. | On for `start`, off for `exec` |
| `--minimum-functions N` | Fails the start when fewer functions load. | `1` when a codebase or Extension is configured, else `0` |
| `--inspect-functions[=PORT]` | Starts the Functions workers with the Node inspector. See [Debugging](/docs/functions/debugging). | Port 9229, counting up per codebase |
| `--offline` | Never contacts the Extensions registry: every Extension must be vendored or cached. | |
| `--no-diagnostics` | Stops recording Firestore requests with their rule evaluations, and rules coverage. | Recorded |
| `--plain` | Prints plain lines instead of the [terminal screen](/docs/tools/terminal#plain-output). | The screen, in a terminal |
| `--hub-port N` | The hub's port. | `emulators.hub.port`, else 4400 |
| `--logging-port N` | The logging listener's port. | `emulators.logging.port`, else 4500 |
| `--eventarc-port N` | The Eventarc emulator's port. | `emulators.eventarc.port`, else 9299 |
| `--tasks-port N` | The Cloud Tasks emulator's port. | `emulators.tasks.port`, else 9499 |
| `--firestore-websocket-port N` | The Firestore requests WebSocket's port. | `emulators.firestore.websocketPort`, else 9150 |

The other emulators' ports come only from `firebase.json`; there is no
`--firestore-port` or `--auth-port`. See [Ports](/docs/reference/ports).

## Not provided

- `functions:shell`. Firenook never starts a second Functions runtime; call
  functions on the running suite with `functions:invoke`.
- Deploy and login commands. Firenook does not intercept them; keep
  firebase-tools installed for those.

## Next

[Configuration](/docs/reference/configuration) covers what Firenook reads
from `firebase.json`, `.firebaserc` and the environment.
