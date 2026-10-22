---
title: Configuration
description: Every firebase.json key and .firebaserc entry Firenook reads, the keys it skips, and every environment variable it reads or sets.
---

Firenook reads your project the way the official Firebase CLI does: from
`firebase.json`, `.firebaserc` and the command line. This page lists every
key it reads, what it skips, and the environment variables that change what
it does. For the flags, see [CLI commands](/docs/reference/cli).

## firebase.json

Every command uses the first `firebase.json` in the current folder or a
folder above it, up to the root of the disk, as the official CLI finds it.
Run in `functions/`, where `npm run serve` runs, a command finds the
project's file. `.firebaserc` is the one beside it. `--config` names another
file, relative to the current folder. With no file to find, every command
that needs one stops:

```text
Firenook: No firebase.json in ~/demo-shop or a folder above it; run firenook init in the project directory or pass --config
```

### Which emulators start

An emulator starts when `firebase.json` configures it, exactly as the
official CLI decides:

| Emulator | Configured by |
| --- | --- |
| Firestore | a top-level `firestore` section, or `emulators.firestore` |
| Storage | a top-level `storage` section, or `emulators.storage` |
| Functions | a top-level `functions` or `extensions` section, or `emulators.functions` or `emulators.extensions` |
| Auth | `emulators.auth` |
| Pub/Sub | `emulators.pubsub` |

Eventarc and Cloud Tasks start with Functions. The hub always runs. The
console and the logging listener run unless `emulators.ui.enabled` is
`false`. When `firebase.json` configures Functions but names no codebase
and no Extensions, Functions, Eventarc and Cloud Tasks are not started, and
a notice says so. `--only` narrows the list further. With nothing
configured, Firenook stops with
`No emulators to start, run firenook init to get started.`

### Keys Firenook reads

| Key | What Firenook does with it |
| --- | --- |
| `firestore.rules` | The Firestore Security Rules file, reloaded when it changes |
| `firestore.indexes` | The composite indexes file. Indexes are not enforced, as officially; the console reads the file to say whether a query's index is declared. A file that cannot be read is a warning, not an error. |
| `firestore` as an array | Several databases: each entry is `{database, rules, indexes}`, and one entry may leave out `database` for `(default)`. Every listed database is served. |
| `storage.rules` | The Storage Security Rules file, for every bucket |
| `storage` as an array | `{target, rules}` entries, with each target's buckets from `.firebaserc` or `--storage-bucket`. A target's rules govern every bucket it maps to. |
| `functions.source` | The codebase folder. Default: `functions` |
| `functions.codebase` | The codebase's name |
| `functions.ignore` | Files that do not trigger a reload when they change |
| `functions.configDir` | Where the codebase's `.env` files are read from. Default: the source folder |
| `functions.runtime` | The Node the codebase deploys on, such as `nodejs22`. It comes before `engines.node` in the codebase's `package.json`. See [Node per codebase](#node-per-codebase). |
| `functions` as an array | Several codebases, each with the keys above |
| `extensions` | Extension instances: each key is an instance id, each value a registry reference or a local path. See [Extensions](/docs/services/extensions). |
| `emulators.<name>.port` | The port of `firestore`, `auth`, `storage`, `functions`, `pubsub`, `eventarc`, `tasks`, `hub`, `ui` or `logging`. See [Ports](/docs/reference/ports). |
| `emulators.<name>.host` | The address to listen on. Default: `localhost`. See [Ports](/docs/reference/ports#host). |
| `emulators.firestore.websocketPort` | The Firestore requests WebSocket's port |
| `emulators.ui.enabled` | `false` turns off the console and the logging listener. `--ui` turns them on all the same, as the official `--ui` does. |
| `emulators.singleProjectMode` | Whether to warn about requests that name another project. Default: `true` |

A `storage` section is optional: without one, Storage starts on
`emulators.storage` with open default rules for the project's bucket.

An invalid indexes file is reported when the emulators start, and the
start goes on:

```text
firenook: the Firestore indexes in ./firestore.indexes.json were not read (invalid index JSON: trailing comma at line 3 column 117); the console explains the queries of database "(default)" as if it declared none
```

### Rules for databases and buckets

As in the official emulator, every Firestore database and every Storage
bucket is governed by some rules, or refuses clients:

- A Firestore database the `firestore` list leaves out follows the rules of
  the `(default)` entry, or of the first entry when there is no
  `(default)`, and follows them as they change. The console's Rules page
  says which rules govern such a database.
- A Storage target mapped to several buckets applies its rules to each of
  them.
- A bucket no target maps to refuses every client request with
  `Permission denied. Storage Emulator has no loaded ruleset.`

### Keys Firenook skips

The official emulators Firenook does not implement are skipped with a
warning, and the rest of the project starts:

```text
Firenook: firebase.json configures the hosting emulator, which Firenook does not implement; skipping it.
```

That applies to `emulators.database`, `emulators.hosting`,
`emulators.dataconnect` and `emulators.apphosting`. Naming one of them in
`--only` is an error. Top-level sections for products Firenook does not
emulate, such as `hosting`, `database` or `remoteconfig`, are not read.

Any other key under `emulators` is an error:

```text
Firenook: Unsupported configured emulator: frobnicate. Valid emulators keys are firestore, auth, storage, functions, pubsub, hub, ui, logging, eventarc, tasks, extensions, singleProjectMode, database, hosting, dataconnect, apphosting.
```

`firenook init --adopt --dry-run` runs every check on a project and lists
what it would add, without changing anything.

## .firebaserc

| Entry | What Firenook does with it |
| --- | --- |
| `projects.default` | The project id when nothing else names one |
| `projects.<alias>` | An alias `--project` can name |
| `targets.<project>.storage.<target>` | The buckets of a Storage target |

`firenook use`, `target:apply` and `target:clear` edit these entries. Other
target types, such as `hosting`, are not read.

A project id is lowercase letters, digits and hyphens, 6 to 30 characters,
starting with a letter, or any id that starts with `demo-`. A `demo-` id
never reaches a real Firebase project. With any other id, Firenook starts
every Functions worker with the emulators' addresses and no Google
credentials, but your functions are your code and can still call outside
services. Firenook is not a network sandbox.

### Which project

Firenook picks the project as the official CLI does, the first of:

1. `--project` (or `-P`);
2. the project `firebase use` chose for this folder or a folder above it,
   which the Firebase CLI keeps in `configstore/firebase-tools.json` under
   `$XDG_CONFIG_HOME`, else `~/.config`;
3. the legacy `firebase` key of `firebase.json`;
4. `.firebaserc`: its only alias, or `projects.default`.

A choice that names an alias selects that alias, and with it the
codebase's `.env.<alias>` file. Firenook only reads the Firebase CLI's
file, and never writes it.

## Functions

### Env files and params

Each codebase reads the official chain of `.env` files from its
`configDir`, later files winning: `.env`, `.env.<projectId>`,
`.env.<alias>` and `.env.local`. The alias is the one the project was
chosen by: `dev` for `--project dev` or `firebase use dev`, when `dev` is
an alias, and otherwise `.firebaserc`'s only alias, or `default`. A project
named by its id has no alias. Having both `.env.<projectId>` and `.env.<alias>` is refused, as
officially. The start says which files it loaded:

```text
firenook functions: Loaded environment variables from .env, .env.dev.
```

Params take their value from those files, else their default, also in the
function's options such as `region` or `memory`. A param with neither stops
its codebase, since Firenook never prompts. See
[Environment variables and secrets](/docs/functions/environment).

### Node per codebase

Your functions run on the Node that runs Firenook: 22, 24 or 26. A
codebase whose `functions.runtime` or `engines.node` asks for another Node
starts with a warning, as in the official emulator:

```text
firenook functions: functions/package.json asks for Node 22 in engines.node, but these functions run on Node 24.20.0, the Node running the emulators; start the emulators with Node 22 to run them on the Node they ask for (with nvm: nvm use 22)
```

In a terminal it is one of the start-up warnings that `w` lists. A range
in `engines.node`, such as `>=22`, is read as npm reads it.

## Environment variables Firenook reads

### The terminal

| Variable | Effect |
| --- | --- |
| `FIRENOOK_PLAIN=1` | Plain lines instead of the [terminal screen](/docs/tools/terminal) |
| `CI` | Plain lines, and no release check |
| `TERM` | `dumb` gives plain lines; `linux` gives plain characters instead of symbols; a name with `256` gives 256 colours |
| `COLORTERM` | `truecolor` or `24bit` gives 24-bit colour |
| `NO_COLOR` | Set to anything, it keeps the screen and drops the colours |
| `FIRENOOK_ASCII=1` | Plain characters instead of symbols, and no clickable links |
| `WT_SESSION` | Set by Windows Terminal; without it, the Windows console gets plain characters |
| `FIRENOOK_NO_UPDATE_CHECK=1` | No release check |
| `NO_UPDATE_NOTIFIER=1` | No release check |
| `XDG_CACHE_HOME`, `LOCALAPPDATA` | Where the release check keeps its last answer, in `firenook/update-check.json`. Defaults: `~/Library/Caches` on macOS, `%LOCALAPPDATA%` on Windows, `~/.cache` elsewhere |

`FIRENOOK_PLAIN`, `FIRENOOK_ASCII`, `CI`, `FIRENOOK_NO_UPDATE_CHECK` and
`NO_UPDATE_NOTIFIER` count as set unless they are empty, `0` or `false`, so
`CI=false` is not CI.

### Extensions

| Variable | Effect |
| --- | --- |
| `FIRENOOK_OFFLINE` | `1` or `true` works as `--offline`: the Extensions registry is never contacted |
| `FIREBASE_TOKEN` | The credential used to fetch an Extension from the registry, on first use only. Without it, Firenook uses the Firebase CLI's stored login. It is never passed to your functions. |
| `XDG_CONFIG_HOME` | Where Firenook looks for the Firebase CLI's stored login, `configstore/firebase-tools.json`, and the project `firebase use` chose. Default: `.config` in your home folder (`%USERPROFILE%` on Windows) |
| `FIREBASE_EXTENSIONS_CACHE_PATH` | The shared cache of Extension sources. Default: `~/.cache/firebase/extensions` |
| `FIREBASE_EXT_URL`, `FIREBASE_TOKEN_URL`, `FIREBASE_GOOGLE_URL`, `FIREBASE_CLIENT_ID`, `FIREBASE_CLIENT_SECRET` | Override the registry and token endpoints, as they do for the Firebase CLI |

`firenook ext:vendor` copies Extensions into the project so none of these is
needed again. See [Without a Google login](/docs/help/no-login).

### The engine

| Variable | Effect |
| --- | --- |
| `FUNCTIONS_DISCOVERY_TIMEOUT` | Seconds to wait while a codebase lists its functions. Default: 10 |
| `FIRENOOK_FIELD_INDEXES` | `0`, `off` or `false` turns off Firestore's field index, so queries scan and sort instead, for comparison. The next start without it builds the index again. |
| `MIMALLOC_PURGE_DELAY`, `MIMALLOC_PURGE_DECOMMITS` | The engine's memory allocator settings. Firenook sets them to `100` and `1` unless you set them |
| `FIRENOOK_LOCATOR_DIR` | Where the CLI commands look for `hub-<project>.json` files instead of the system's temporary folder. Meant for tests; the engine still writes its file to the temporary folder |

## Variables Firenook sets

Firenook starts the engine with `GCLOUD_PROJECT` and
`GOOGLE_CLOUD_PROJECT` set to the project id, demo credentials of the run's
own in `GOOGLE_APPLICATION_CREDENTIALS`, and a gcloud folder of the run's
own in `CLOUDSDK_CONFIG`, so the gcloud configuration of your machine is not
used. It removes `CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE`.

The command of `emulators:exec` gets the official variables, for each
emulator that runs and for no other, so the Admin SDKs and Google Cloud
clients find the emulators by themselves:

| Variable | Value | Set when |
| --- | --- | --- |
| `FIRESTORE_EMULATOR_HOST`, `FIREBASE_FIRESTORE_EMULATOR_ADDRESS` | `127.0.0.1:8080` | Firestore runs |
| `FIREBASE_AUTH_EMULATOR_HOST` | `127.0.0.1:9099` | Auth runs |
| `FIREBASE_STORAGE_EMULATOR_HOST` | `127.0.0.1:9199` | Storage runs |
| `STORAGE_EMULATOR_HOST` | `http://127.0.0.1:9199` | Storage runs |
| `PUBSUB_EMULATOR_HOST` | `127.0.0.1:8085` | Pub/Sub runs |
| `CLOUD_TASKS_EMULATOR_HOST` | `127.0.0.1:9499` | Functions runs |
| `CLOUD_EVENTARC_EMULATOR_HOST` | `http://127.0.0.1:9299` | Functions runs |
| `FIREBASE_EMULATOR_HUB` | `127.0.0.1:4400` | Always |
| `GCLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT` | The project id | Always |
| `FIREBASE_CONFIG` | `{"projectId": ..., "storageBucket": ..., "databaseURL": ...}` for the project | Unless you set it |
| `GOOGLE_APPLICATION_CREDENTIALS` | A demo `authorized_user` file in the run's folder, whose token address is the hub | Unless you set it |
| `CLOUDSDK_CONFIG` | A gcloud folder of the run's own | Always |
| `NODE_OPTIONS` | Yours, then `--require` of the CLI's `exec-token.cjs`, which answers a Node.js Admin SDK's token request with the emulators' token | Unless you set `GOOGLE_APPLICATION_CREDENTIALS` |

The values follow your ports, and the address clients can connect to:
`127.0.0.1` for the default `localhost` and for `0.0.0.0`, and `::1` for
`::`. With your own `GOOGLE_APPLICATION_CREDENTIALS`, `exec` passes it
on unchanged, as the official `emulators:exec` does, and says so: a call
that needs an access token then gets one with your credentials, from
Google. Your functions get the emulators' variables too, with demo
credentials that are never yours; see
[Environment variables and secrets](/docs/functions/environment).

## Next

[Ports](/docs/reference/ports) lists every listener with its default, its
`firebase.json` key and its flag.
