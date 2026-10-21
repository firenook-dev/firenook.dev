---
title: Configuration
description: Every firebase.json key and .firebaserc entry Firenook reads, the keys it skips, and every environment variable it reads or sets.
---

Firenook reads your project the way the official Firebase CLI does: from
`firebase.json`, `.firebaserc` and the command line. This page lists every
key it reads, what it skips, and the environment variables that change what
it does. For the flags, see [CLI commands](/docs/reference/cli).

## firebase.json

Firenook reads `firebase.json` from the current folder, or the file
`--config` names. A missing file stops every command that needs it:

```text
Firenook: No firebase.json at ~/demo-shop/firebase.json; run firenook init in the project directory or pass --config
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
| `firestore.indexes` | The composite indexes file |
| `firestore` as an array | Several databases: each entry is `{database, rules, indexes}`, and one entry may leave out `database` for `(default)`. Every listed database is served. |
| `storage.rules` | The Storage Security Rules file, for every bucket |
| `storage` as an array | `{target, rules}` entries, with each target's buckets from `.firebaserc` or `--storage-bucket` |
| `functions.source` | The codebase folder. Default: `functions` |
| `functions.codebase` | The codebase's name |
| `functions.ignore` | Files that do not trigger a reload when they change |
| `functions.configDir` | Where the codebase's `.env` files are read from. Default: the source folder |
| `functions.runtime` | Read and shown; the functions run on the Node that runs Firenook |
| `functions` as an array | Several codebases, each with the keys above |
| `extensions` | Extension instances: each key is an instance id, each value a registry reference or a local path. See [Extensions](/docs/services/extensions). |
| `emulators.<name>.port` | The port of `firestore`, `auth`, `storage`, `functions`, `pubsub`, `eventarc`, `tasks`, `hub`, `ui` or `logging`. See [Ports](/docs/reference/ports). |
| `emulators.<name>.host` | The address to listen on. Every emulator listens on one host. |
| `emulators.firestore.websocketPort` | The Firestore requests WebSocket's port |
| `emulators.ui.enabled` | `false` turns off the console and the logging listener |
| `emulators.singleProjectMode` | Whether to warn about requests that name another project. Default: `true` |

A `storage` section is optional: without one, Storage starts on
`emulators.storage` with open default rules for the project's bucket.

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
| `projects.default` | The project id when you pass no `--project` |
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

`FIRENOOK_PLAIN`, `FIRENOOK_ASCII` and `CI` count as set unless they are
empty, `0` or `false`.

### Extensions

| Variable | Effect |
| --- | --- |
| `FIRENOOK_OFFLINE` | `1` or `true` works as `--offline`: the Extensions registry is never contacted |
| `FIREBASE_TOKEN` | The credential used to fetch an Extension from the registry, on first use only. Without it, Firenook uses the Firebase CLI's stored login. It is never passed to your functions. |
| `XDG_CONFIG_HOME` | Where Firenook looks for the Firebase CLI's stored login, `configstore/firebase-tools.json`. Default: `~/.config` |
| `FIREBASE_EXTENSIONS_CACHE_PATH` | The shared cache of Extension sources. Default: `~/.cache/firebase/extensions` |
| `FIREBASE_EXT_URL`, `FIREBASE_TOKEN_URL`, `FIREBASE_GOOGLE_URL`, `FIREBASE_CLIENT_ID`, `FIREBASE_CLIENT_SECRET` | Override the registry and token endpoints, as they do for the Firebase CLI |

`firenook ext:vendor` copies Extensions into the project so none of these is
needed again. See [Without a Google login](/docs/help/no-login).

### The engine

| Variable | Effect |
| --- | --- |
| `FUNCTIONS_DISCOVERY_TIMEOUT` | Seconds to wait while a codebase lists its functions. Default: 10 |
| `FIRENOOK_FIELD_INDEXES` | `0`, `off` or `false` turns off Firestore's field index, so queries scan instead, for comparison |
| `MIMALLOC_PURGE_DELAY`, `MIMALLOC_PURGE_DECOMMITS` | The engine's memory allocator settings. Firenook sets them to `100` and `1` unless you set them |
| `FIRENOOK_LOCATOR_DIR` | Where the CLI commands look for `hub-<project>.json` files instead of the system's temporary folder. Meant for tests; the engine still writes its file to the temporary folder |

## Variables Firenook sets

Firenook starts the engine, and the command of `emulators:exec`, with these
variables, so the Admin SDKs and Google Cloud clients find the emulators by
themselves:

| Variable | Value |
| --- | --- |
| `FIRESTORE_EMULATOR_HOST` | `127.0.0.1:8080` |
| `FIREBASE_AUTH_EMULATOR_HOST` | `127.0.0.1:9099` |
| `FIREBASE_STORAGE_EMULATOR_HOST` | `127.0.0.1:9199` |
| `STORAGE_EMULATOR_HOST` | `http://127.0.0.1:9199` |
| `PUBSUB_EMULATOR_HOST` | `127.0.0.1:8085` |
| `FIREBASE_EMULATOR_HUB` | `127.0.0.1:4400` |
| `GCLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT` | The project id |
| `GOOGLE_APPLICATION_CREDENTIALS` | A demo credentials file in the run's folder, so SDKs that ask for credentials get placeholder ones |
| `CLOUDSDK_CONFIG` | A folder in the run's folder, so the gcloud configuration of your machine is not used |

The values follow your ports and `--host`; a wildcard host such as
`0.0.0.0` becomes `127.0.0.1`. Every variable in the table is set, even
for an emulator that is not running. `CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE` is
removed. Your functions get these and more, such as
`CLOUD_TASKS_EMULATOR_HOST` and `CLOUD_EVENTARC_EMULATOR_HOST`; see
[Environment variables and secrets](/docs/functions/environment).

## Next

[Ports](/docs/reference/ports) lists every listener with its default, its
`firebase.json` key and its flag.
