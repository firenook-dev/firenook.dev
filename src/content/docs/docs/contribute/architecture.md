---
title: Architecture
description: 'How Firenook is put together: the npm launcher, the native engine and its crates, the data store, the Functions runtime and the console.'
---

This page explains how Firenook is built, for anyone who wants to read the
code, fix a bug or understand why it behaves as it does. The engine
repository's [DESIGN.md](https://github.com/firenook-dev/firenook/blob/main/DESIGN.md)
holds the full contracts; this is the map.

## The pieces

Three kinds of process run when you start the emulators:

```text
npx firenook emulators:start
        │
        ▼
npm launcher (Node)        reads firebase.json and .firebaserc, checks Node and
        │                  the engine, draws the terminal
        │ starts, with every port, path and setting as arguments
        ▼
engine (firenook, Rust)    one native process that owns every port
  ├─ Firestore             gRPC, REST and WebChannel → queries, listeners → store
  ├─ Authentication, Cloud Storage, Pub/Sub, Cloud Tasks, Eventarc
  ├─ Security Rules        compiled and evaluated in process, for Firestore and Storage
  ├─ Functions runtime     discovery, routing, triggers, Extensions
  ├─ hub, logging          the official coordination endpoints
  └─ console               the web console and its API, on the UI port
        │ starts one per Functions codebase
        ▼
Functions workers (Node)   run your code with the firebase-functions SDK,
                           on the Node that runs Firenook: 22, 24 or 26
```

The launcher and the engine come in separate npm packages: `firenook`, and
one `@firenook/cli-<platform>` package per platform, which npm or Bun selects
from optional dependencies.

## The npm launcher

The launcher is plain JavaScript in `packages/cli`. It is what `npx firenook`
runs, and it does the work that needs no engine:

- **Reads the project** the way the Firebase CLI does: the first
  `firebase.json` in the current folder or a folder above it, `.firebaserc`
  aliases and targets, the project `firebase use` chose, `--only`, ports,
  hosts and the project id. Unknown options are errors; no option is
  silently ignored.
- **Checks the machine.** It refuses a Node older than 22 for the
  emulators, with how to switch, and warns on a Node they are not tested
  on. On Linux it checks for glibc 2.28 or newer and says what an older
  system or Alpine lacks. It picks the platform package and checks the
  engine binary against the package's receipt and SHA-256 before it runs
  it.
- **Prepares the run.** It creates `.firenook/runs/session-*` with a
  `launch.json` record, writes placeholder Google credentials, and starts
  the engine as `firenook suite …` with every port given explicitly. With
  `--build` it first starts each codebase's own `build:watch` script.
- **Sets up `init`.** The new-project screen, the files, the installs and
  the pin are the launcher's work; the engine is not involved until the
  emulators start.
- **Draws the terminal.** In a terminal the engine prints one
  `FIRENOOK_EVENT` line per fact (a start-up step, a function call, a
  failure) and the launcher draws the screen from them. Pipes and CI get the
  engine's plain lines unchanged.
- **Stops it safely.** On macOS and Linux it forwards Ctrl-C as a signal; on
  Windows it asks the engine to stop over a private pipe. Either way the
  engine saves the data before it exits. When the launcher itself is
  killed, the engine notices, saves the data and stops too.
- **Talks to a running suite** for `emulators:export`, `functions:invoke`,
  `firestore:delete` and `mcp`, which find it through the hub's locator file,
  as the official CLI does. Each suite also records itself with its folder
  in `firenook-hubs/` in the temporary folder, so a command reaches the
  suite started from its folder when two run for one project id.

## The engine

The engine is one Rust binary, `firenook`, built from a Cargo workspace
under `crates/`. Its `suite` command runs everything; `firestore`, `auth` and
`pubsub` run one service alone, and `state` and `extensions` work on saved
data and Extensions without starting anything.

| Crate | What it does |
| --- | --- |
| `cli` | The `firenook` binary and its commands |
| `suite-runtime` | Starts and stops the whole suite, owns every listener, opens and checks saved data |
| `core-store` | Firestore's documents: snapshots in memory and on disk, the journal, recovery, the ordered field index |
| `query-engine` | Filters, ordering, cursors, aggregations and query planning |
| `watch-broker` | Listener targets and the changes sent to them |
| `grpc-front`, `rest-front`, `webchannel-front` | Firestore's three transports, the one each SDK uses, over the shared store |
| `rules-engine`, `rules-runtime` | The Security Rules compiler and evaluator, and how rules are loaded and applied |
| `export-format` | Imports and exports in the official format, its framing checked byte for byte against the official emulator's exports |
| `auth-front` | The Authentication emulator, a port of the official one with its operations, errors and tokens |
| `storage-front` | Cloud Storage's Firebase and JSON APIs, object bytes on disk, rules in process |
| `functions-runtime` | Discovers functions, runs the Node workers, routes calls, reloads on save |
| `functions-bridge` | Matches Firestore events to triggers and builds their event envelopes |
| `extensions` | Turns `firebase.json` Extension instances into Functions backends; registry, cache and vendoring |
| `pubsub-front` | The Pub/Sub emulator over gRPC and HTTP/JSON on one port, and scheduled functions |
| `tasks-front` | The Cloud Tasks emulator for `onTaskDispatched` queues |
| `suite-front` | The hub, logging and UI endpoints |
| `console-front` | The console's API, and the console itself, embedded in the binary |
| `capture-proxy` | Records traffic to the official emulator for test fixtures; not part of a normal run |

Firestore, Authentication, Storage and the other services are built from
their own crates but run in the one engine process, sharing one store and
one rules engine. That is why Storage rules can call `firestore.get()`
without a second emulator, and why there is no Java process to start.

## The data store

Firestore's data lives in a [redb](https://github.com/cberner/redb) database
file, `firenook.redb`, with a write-ahead journal beside it, `firenook.wal`.
A write is acknowledged once it is in the journal; a background task syncs
the journal and commits the database to the disk once a second, and again
at shutdown. After a crash, the next start replays the journal into the
database. The database's page cache is capped at 64 MiB by default, so the
cache does not grow with the data.

An ordered field index lists, for each collection and top-level field,
every document that holds the field, sorted by its value in Firestore's
order. It serves `==` and `in` filters, an `orderBy` on one top-level
field, range filters on it and cursors without reading the whole
collection: `orderBy("createdAt", "desc").limit(20)` reads twenty documents
however large the collection is. `==` and `in` filters on other fields are
checked against the index before a document is read. The index only finds
and orders candidates; every filter, order and limit is still checked on
each document. Its entries are written in the same transaction as the
documents they describe. A store an earlier release wrote builds the index
once, on its first start with 0.2.0 (timed in
[data between releases](/docs/help/versions#data-between-releases)).

Cloud Storage keeps object bytes as files and their metadata in its own redb
file and journal. Authentication keeps its state in one JSON file.

A kept state directory, `.firenook/state` with `--keep-data`, holds all of
them, plus `native-state.json`, the receipt that records which project,
buckets, format and seed the data came from. A start picks the data up only
when they match; that check is behind the refusals in
[troubleshooting](/docs/help/troubleshooting).

## The Functions runtime

Firenook runs your functions itself; firebase-tools is not involved. To find
them, it runs the control program of the `firebase-functions` SDK installed in
your codebase, as the official emulator does. It then starts one Node worker
per codebase, on the Node that runs Firenook (22, 24 or 26), as the official
emulator runs them on its own. The worker's script is built into the engine
and handles requests as the official emulator's runtime does, so your
functions see the same request objects.

The engine routes HTTP and callable requests to the workers, and delivers
background events to them: Firestore changes through `functions-bridge`,
Auth and Storage events from their services, Pub/Sub messages and schedules
from `pubsub-front`, and task-queue dispatches from `tasks-front`. A watcher
reloads a codebase when you save, while every emulator keeps running. Each
Extension instance becomes one more codebase, with its own worker.

## The console

The console is a React application in `console/`, built with Vite. Release
builds embed its files in the engine binary, which serves them at `/console`
on the UI port, with the Console API beside them. The browser keeps one live
connection to the engine, so pages update as your app runs. The console
loads nothing from the internet, and answers only for names that mean the
local machine unless you allow others.

## How behaviour stays compatible

Firenook's behaviour is pinned to recordings of the official emulator. Before
a behaviour changes, the official emulator's answers are recorded as a
synthetic fixture under `conformance/fixtures`. Every pull request replays
those fixtures against Firenook, alongside the Rust tests and the packed
installs on all five platforms. Where Firenook deliberately differs, the
replay asserts the difference and records why.

## Next

[Build from source](/docs/contribute/build) shows how to build the engine
and the console and run the tests.
