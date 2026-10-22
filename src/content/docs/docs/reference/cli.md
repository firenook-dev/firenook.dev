---
title: CLI commands
description: Every firenook command and flag in 0.2.0, grouped as firenook --help groups them, with what each does and its default.
---

Every command the `firenook` executable takes, grouped as `firenook --help`
groups them. Run them through your package manager (`npx firenook ...`,
`bunx firenook ...`) or from your package scripts.

```console
$ npx firenook --version
0.2.0 (engine source bbd437e754a4c14c5ab5d37e01843930f5a9bade)
```

`firenook --help`, `-h` or `help` prints one help text for every command,
and so does `--help` after a command, which then runs nothing:
`firenook functions:invoke checkout --help` prints the help and calls no
function. `--version` or `-v` prints the release and the engine revision it
was built from.

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

- Every command uses the first `firebase.json` in the current folder or a
  folder above it, as the official CLI does, so a command run in
  `functions/` finds the project's file.
- Firenook never asks for confirmation. Commands that delete need
  `--force`. Only `init` asks anything, and only in a terminal, where it
  shows its choices on a screen.

## Project

### init

```sh
firenook init [--yes] [--no-install] [--no-pin] [--language typescript|javascript|none]
              [--only firestore,auth,functions,storage,pubsub] [--agent claude,cursor,vscode]
              [--project ID] [--dry-run] [--force] [--json]
```

Sets up a new project in the current folder. In a terminal it opens one
screen with every choice already made: the project id, the emulators on
their usual ports, the Functions language (TypeScript by default), the
coding agents to give the [MCP server](/docs/tools/mcp), and whether to
install the packages and pin Firenook. Enter creates the project and Esc
leaves without writing anything. It then writes the files, installs the
packages, pins Firenook, builds a TypeScript codebase once and offers to
start the emulators in the same terminal.
[Start a new project](/docs/get-started/new-project) shows the screen.

Without a terminal, or with `--dry-run`, `--json` or `--non-interactive`,
it takes its choices from the options instead. It writes the files and
prints the commands that finish the set-up:

```console
$ npx firenook init
Firenook init: project demo-shop in ~/demo-shop
  wrote   ~/demo-shop/firebase.json
  wrote   ~/demo-shop/.firebaserc
  wrote   ~/demo-shop/firestore.rules
  wrote   ~/demo-shop/firestore.indexes.json
  wrote   ~/demo-shop/storage.rules
  wrote   ~/demo-shop/functions/package.json
  wrote   ~/demo-shop/functions/tsconfig.json
  wrote   ~/demo-shop/functions/src/index.ts
  wrote   ~/demo-shop/functions/.gitignore
  wrote   ~/demo-shop/.gitignore
Next steps:
  npm install --prefix functions
  npx firenook emulators:start --keep-data --build
  npx firenook mcp add   (gives Claude Code the Firenook MCP server)
```

`--yes` runs those steps as well, one line each. Here with `--no-pin`, so
`package.json` is left alone (trimmed):

```console
$ npx firenook init --yes --no-pin
Firenook init: project demo-shop in ~/demo-shop
  wrote   ~/demo-shop/firebase.json
  ...
  wrote   ~/demo-shop/.gitignore
  done    Agents: .mcp.json for Claude Code (0.0 s)
  done    Packages: npm install in functions/, 241 packages (6.3 s)
  done    Build: tsc, into functions/lib (0.9 s)
Next steps:
  npx firenook emulators:start --keep-data --build
```

The files are the same either way. `firebase.json` configures Firestore,
Storage, the Functions codebase and every emulator on its usual port, with
the console on. `.firebaserc` records the project id as the default. The
rules and indexes are the official templates. The codebase is the official
TypeScript one (`functions/package.json` with `build`, `build:watch` and a
`serve` script, `tsconfig.json` and `src/index.ts`, and a `predeploy` build
in `firebase.json`), or `functions/index.js` with
`--language javascript`. `.firenook/` and `*-debug.log` are added to
`.gitignore`. Pinning writes Firenook into `package.json` as an exact
devDependency, with an `emulators` script that runs
`firenook emulators:start --keep-data`, plus `--build` for TypeScript. A
script or a pin already there is kept.

| Option | Does | Default |
| --- | --- | --- |
| `--yes` | Does the whole set-up without a screen: the files, the agents, the pin, the installs and the first build | Prints the commands instead |
| `--no-install` | Leaves out the installs and the first build | Installed |
| `--no-pin` | Leaves `package.json` alone | Firenook pinned, with an `emulators` script |
| `--language L` | `typescript`, `javascript` or `none` | `typescript` |
| `--no-functions` | The same as `--language none` | |
| `--only NAMES` | The emulators to configure, from `firestore`, `auth`, `functions`, `storage` and `pubsub`. The console and the hub always come, and Cloud Tasks and Eventarc come with Functions. | All five, and Functions unless the language is `none` |
| `--agent LIST` | The coding agents to give the MCP server: `claude`, `cursor`, `vscode` | The agents the folder shows |
| `--project ID`, `-P ID` | The project id to record in `.firebaserc` | The id already in `.firebaserc`, else the folder's name with `demo-` in front |
| `--dry-run` | Prints what it would write, and writes nothing | |
| `--force` | Writes `firebase.json` again, and keeps every other file that exists | Refused when `firebase.json` exists |
| `--json` | Prints the plan as one line of JSON instead of the list | |

The start command `init` prints keeps the data with `--keep-data`, which
needs Firestore, Auth and Storage. When `--only` leaves Auth or Storage
out, start without `--keep-data`.

`init` will not write over an existing `firebase.json`. It points you to
`init --adopt`, and exits 1:

```console
$ npx firenook init
Firenook: ~/demo-shop/firebase.json exists; use firenook init --adopt to adapt it, or --force to write a new one (the other files there are kept)
```

`--force` writes `firebase.json` again and keeps your rules, indexes,
Functions code and `.firebaserc`. Delete a file first to get its template
back:

```console
$ npx firenook init --force
Firenook init: project demo-shop in ~/demo-shop
  wrote   ~/demo-shop/firebase.json
  keep    ~/demo-shop/.firebaserc (exists)
  keep    ~/demo-shop/firestore.rules (exists)
  keep    ~/demo-shop/firestore.indexes.json (exists)
  keep    ~/demo-shop/storage.rules (exists)
  keep    ~/demo-shop/functions/package.json (exists)
  keep    ~/demo-shop/functions/tsconfig.json (exists)
  keep    ~/demo-shop/functions/src/index.ts (exists)
  keep    ~/demo-shop/functions/.gitignore (exists)
Next steps:
  npm install --prefix functions
  npx firenook emulators:start --keep-data --build
  npx firenook mcp add   (gives Claude Code the Firenook MCP server)
```

### init --adopt

```sh
firenook init --adopt [--dry-run] [--json]
```

Checks an existing project the way the emulators will read it and prints a
plan: errors Firenook cannot accept (`error`), configured services it skips
(`skip`), other warnings (`warn`), and the additions it can make (`add`).
Additions are a missing `emulators` entry for a configured service, a
missing `.firebaserc` default, a rules file that is referenced but missing,
and the MCP server for the coding agents the folder shows.

Without `--dry-run` it applies the additions as text: `firebase.json` and
`.firebaserc` keep every byte they had, and each addition goes at the end
of the object it joins, with that object's indentation, line endings and
layout. When there are errors it changes nothing and exits 1. In a
terminal, `init` in a folder that has a `firebase.json` shows the same plan
and applies it when you say yes.

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
firenook use [--json]
firenook use alias|projectId [--alias NAME]
firenook use --add ID [--alias NAME]
firenook use --unalias NAME
firenook use --clear
```

Edits the project aliases in `.firebaserc`, as `firebase use` does, with no
network and no login. On its own it lists the aliases and the active
project, as JSON with `--json`. With an alias or a project id it makes that
the active project (`projects.default`), and `--alias NAME` also records
the id under that alias. `--add` records a project under `--alias`, or as
`default`, the active project, when you give no alias. `--unalias` removes
an alias. `--clear` removes `projects.default`, so no project is active,
and keeps the aliases.

```console
$ npx firenook use --add demo-shop --alias dev
Created alias dev for demo-shop in ~/demo-shop/.firebaserc.
$ npx firenook use dev
Now using alias dev (demo-shop)
$ npx firenook use --clear
Cleared active project.
Project aliases in ~/demo-shop/.firebaserc:
  dev (demo-shop)
No active project (projects.default is unset).
Run firenook use --add <projectId> --alias <name> to define an alias, firenook use <alias|projectId> to activate one.
```

A project chosen with `firebase use` for this folder comes before
`projects.default`, as in the official CLI, and `use` says so when there
is one. Firenook reads that choice and never writes it. See
[which project](/docs/reference/configuration#which-project).

### target:apply and target:clear

```sh
firenook target:apply storage NAME BUCKET...
firenook target:clear storage NAME
```

Map a Storage target to one or more buckets in `.firebaserc`, or remove
the mapping, for a `firebase.json` whose `storage` section is a list of
`{target, rules}` entries. The target's rules then govern every bucket it
maps to. Only `storage` targets exist; `hosting` and `database` are
refused.

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
the result as JSON: the Node it runs on, the engine binary it found, how it
reads `firebase.json` and `.firebaserc` (project, services, ports, host,
data folder), the warnings, which Extensions can start offline, and the
version. It takes the same options as `emulators:start`, plus
`--instance`.

`problems` lists what would stop the emulators: a Node they do not start
on, or a missing engine. `doctor` itself runs on any Node from 20 up, and
exits 1 when `problems` is not empty. A configuration error is printed as
an error and also exits 1. Trimmed:

```console
$ npx firenook doctor
{
  ...
  "node": {
    "version": "24.20.0",
    "major": 24,
    "tested": true,
    "path": "~/.nvm/versions/node/v24.20.0/bin/node"
  },
  ...
  "warnings": [],
  "problems": [],
  "version": "0.2.0",
  "engineRevision": "bbd437e754a4c14c5ab5d37e01843930f5a9bade"
}
```

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

With `--build`, each Functions codebase's own `build:watch` script runs
beside the engine (its `build` script when it has no `build:watch`). The
emulators start after the first compile, and every save is compiled and
loaded again, with the compiler's errors in the log. Firenook compiles
nothing itself: the scripts are your project's.

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

The command gets the addresses of the emulators that run in its
environment, listed in
[Configuration](/docs/reference/configuration#variables-firenook-sets). The
console stays off unless you pass `--ui` or `firebase.json` sets
`emulators.ui.enabled: true`, and the output is always plain lines. See
[Run your tests](/docs/get-started/tests).

With `--build`, each codebase's `build` script runs once before the
emulators start. When it fails, your command does not run and `exec` exits
1:

```console
$ npx firenook emulators:exec --build "npm test"
Build: functions runs its build script before the emulators start
build functions: src/index.ts:7:9 TS2322: Type 'string' is not assignable to type 'number'.
build functions: build failed (exit code 2)
Firenook: the build in functions failed (npm run build); the tests did not run
```

### emulators:export

```sh
firenook emulators:export DIR [--only firestore,auth,storage] [--force] [--json]
```

Exports the running suite's Firestore, Auth and Storage data to `DIR` in the
official export format, which `--import` reads. It finds the suite as
described under [Which suite a command reaches](#which-suite-a-command-reaches).

```console
$ npx firenook emulators:export ../demo-shop-export
Found running emulator hub for project demo-shop at http://127.0.0.1:4400; exporting firestore, auth, storage to ~/demo-shop-export
Export complete: ~/demo-shop-export
```

| Option | Does | Default |
| --- | --- | --- |
| `--only` | Exports only these of `firestore`, `auth`, `storage` | Every one that runs |
| `--force` | Writes into a folder that is not empty and holds no earlier export | Refused; an earlier export is replaced |
| `--json` | Prints the result as JSON | |
| `--hub-port N` | Reaches the suite whose hub listens on this port, and no other | |

The destination may not be the project folder, the current folder or a
folder above either.

### firestore:delete

```sh
firenook firestore:delete PATH [-r | --shallow] [-f] [--database ID]
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
{"path":"orders","mode":"recursive","deleted":5}
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
$ npx firenook functions:invoke checkout
201 Created http://127.0.0.1:5001/demo-shop/us-central1/checkout
{"id":"a0oaXeYJwPN6xVPXdqmc","total":0}
$ npx firenook functions:invoke sendReceipt --event-data '{"total":36}' --params '{"orderId":"C3"}'
Firenook: firestore event google.cloud.firestore.document.v1.created for sendReceipt (us-central1, gcfv2) via trigger key us-central1-sendReceipt-0
200 OK http://127.0.0.1:5001/functions/projects/demo-shop/triggers/us-central1-sendReceipt-0
{"status":"acknowledged"}
```

A scheduled function takes an event too. Without `--event-data` the call
goes to an HTTP route the function does not have, and fails with
`404 Not Found`:

```console
$ npx firenook functions:invoke nightlyReport --event-data '{}'
Firenook: schedule event pubsub for nightlyReport (us-central1, gcfv2) via trigger key us-central1-nightlyReport-0
200 OK http://127.0.0.1:5001/functions/projects/demo-shop/triggers/us-central1-nightlyReport-0
```

| Option | Does | Default |
| --- | --- | --- |
| `--data JSON` | Sends `{"data": <JSON>}` as a JSON request body, the shape a callable function reads | No body |
| `--method M` | The HTTP method, for an HTTPS function | `POST` |
| `--region R` | The region, when the name is deployed in several | `us-central1` |
| `--event-data JSON` | Sends a background event with this payload instead of a request | |
| `--resource PATH` | The event's resource, such as a Firestore document path | |
| `--params JSON` | Values for the trigger's wildcards, such as `{"orderId":"C3"}` | |
| `--auth JSON` | `{"uid": ..., "token": ...}` or `{"admin": true}` for first-generation events | |
| `--event-type T` | The CloudEvent type, for an Eventarc custom event | The trigger's |
| `--hub-port N` | As for `emulators:export` | |

The same call is the `functions_invoke` tool of the MCP server, and the
console's Functions page can call a function as any user.

### ext:vendor

```sh
firenook ext:vendor [--instance ID]... [--offline]
```

Copies the registry Extensions that `firebase.json` names into the project,
under `extensions/.sources`, each with its registry record in
`firenook-registry.json`. Later starts then need no network and no Firebase
login. `--instance` vendors only the instances you name, and can be
repeated. See [Extensions](/docs/services/extensions).

`--offline` copies only what the shared Extensions cache already holds and
never contacts the registry. An Extension it cannot copy is an error, and
the command exits 1:

```console
$ npx firenook ext:vendor --offline
firenook extensions: counter (firebase/firestore-counter@0.2.10) could not be vendored: firebase/firestore-counter@0.2.10 is not vendored under ~/demo-shop/extensions/.sources/firebase/firestore-counter@0.2.10 and not in the cache at ~/.cache/firebase/extensions/firebase/firestore-counter@0.2.10; run `firenook ext:vendor` with network access
```

### mcp

```sh
firenook mcp [--project ID] [--config PATH] [--only GROUPS] [--hub-port N]
```

Serves the running suite to a coding agent as an MCP server over stdio.
`--only` takes tool groups (`firestore`, `auth`, `storage`, `functions`,
`logs`, `rules`, `pubsub`, `tasks`, `schedules`, `eventarc`, `extensions`,
`reset`). Outside a project, it uses the one suite that runs. See
[Connect your coding agent](/docs/tools/mcp) and
[MCP tools](/docs/reference/mcp-tools).

### mcp add

```sh
firenook mcp add [--agent claude,cursor,vscode] [--dry-run] [--force] [--json]
```

Writes the `firenook mcp` server into the project files of your coding
agents: `.mcp.json`, `.cursor/mcp.json` and `.vscode/mcp.json`. See
[Connect your coding agent](/docs/tools/mcp#set-it-up).

### Which suite a command reaches

`emulators:export`, `firestore:delete`, `functions:invoke` and `mcp` talk
to a running suite. They find its hub as the official CLI does, through the
`hub-<project>.json` file it writes in the system's temporary folder, then
through the hub port in `firebase.json`. Two things differ:

- Run in a project's folder, or a folder inside it, they reach the suite
  started from that folder, even when another suite runs for the same
  project id.
- `--hub-port N` reaches the suite whose hub listens on that port, and no
  other.

With two suites for one project id and neither rule to choose between
them, the command asks you to, and exits 1. See
[Run two suites at once](/docs/reference/ports#run-two-suites-at-once).

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
~/demo-shop/.firenook/state/firestore/firenook.redb: 135 KB

  Documents                           2   332 B of keys and values in 4 KB of pages
  Field index                         6   332 B of keys and values in 4 KB of pages
  Field index names                   4   155 B of keys and values in 4 KB of pages
  Collection index                    2   224 B of keys and values in 4 KB of pages
  Collection-group index              2   242 B of keys and values in 4 KB of pages
  Store metadata                      5   118 B of keys and values in 4 KB of pages
  Old documents table                 0   0 B of keys and values in 0 B of pages
  Free pages, redb's own                  111 KB

firenook state:compact --state-dir ~/demo-shop/.firenook/state returns the free pages to the disk.
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
| `-P ID`, `--project ID` | The project id or alias. Default: the project `firebase use` chose for this folder, else `projects.default` in `.firebaserc`. |
| `-c PATH`, `--config PATH` | The `firebase.json` to read. Default: the first `firebase.json` in the current folder or a folder above it. |
| `--json` | Prints the result as JSON (`doctor` always does; `init`, `use`, `emulators:export`, `firestore:delete` and `mcp add` on request). |
| `--debug` | Writes every log record of the run to `.firenook/runs/session-*/firenook-debug.log`. The plain output prints the path, and the run's `launch.json` records it. |
| `--log-verbosity LEVEL` | `DEBUG`, `INFO`, `QUIET`, `SILENT`, `WARN` or `ERROR`. `DEBUG` works as `--debug`; the others are accepted for compatibility, and Firenook prints its full log. |
| `--non-interactive` | Accepted for compatibility. With `init` it skips the screen and takes the options, as without a terminal. |
| `-h`, `--help` | Prints the help, and runs nothing. |

## Start and exec options

`emulators:start`, `emulators:exec` and `doctor` take these.

| Option | Does | Default |
| --- | --- | --- |
| `--only NAMES` | Starts only these emulators, by the official names: `auth`, `functions`, `firestore`, `storage`, `pubsub`. `extensions` means `functions`; `eventarc`, `tasks`, `hub`, `ui` and `logging` follow their parent. `database`, `hosting`, `dataconnect` and `apphosting` are refused. | Every configured emulator |
| `--import DIR` | Imports an export (Firestore, Auth, Storage) at start. With `--keep-data`, only on the first start. A folder without an export's metadata file is a warning, and the start goes on empty. | |
| `--export-on-exit[=DIR]` | Exports when the emulators stop, to `DIR` or back to the `--import` folder. | |
| `--keep-data` | Keeps the data between runs in `.firenook/state`. Needs Firestore, Auth and Storage running. See [Keep data between runs](/docs/data/keep-data). | A new, empty folder for every run |
| `--state-dir DIR` | Keeps the run's data in `DIR`. A folder that already holds data needs `--resume-state` or `--keep-data`. | `.firenook/runs/session-*/state` |
| `--resume-state` | Picks up the data in `--state-dir`. | |
| `--build` | Runs each Functions codebase's `build:watch` script (`build` for `exec`) and starts the emulators after the first compile. | |
| `--durability MODE` | `write-behind` confirms a write once it is in the journal and syncs every second and at shutdown; `per-commit` syncs every write before confirming it. | `write-behind` |
| `--storage-bucket TARGET=BUCKET` | Maps a Storage target to a bucket for this run. Repeatable. | `.firebaserc` targets |
| `--host HOST` | The address the emulators listen on. See [Ports](/docs/reference/ports#host). | `localhost` |
| `--allowed-hosts NAMES` | More host names the console answers for, comma-separated. See [The console](/docs/tools/console#reach-it-by-another-name). | |
| `--ui` | Turns the console on, even when `firebase.json` sets `emulators.ui.enabled: false`. | On for `start` unless `firebase.json` turns it off; off for `exec` |
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
