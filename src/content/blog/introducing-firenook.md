---
title: Introducing Firenook
description: Firenook runs the Firebase emulators from one npm package, with your firebase.json, SDKs and ports, no Java, and data that survives restarts.
date: 2026-10-23
---

Firenook is a drop-in replacement for the Firebase Local Emulator Suite. It
reads your `firebase.json`, listens on the same ports and keeps your data
between runs. 0.2.0 is its first release for public use. This post explains
why it exists, what it does today, what it does not do yet, and how to try it
on your project in three steps.

## A day with the emulator

If you build on Firebase, the emulator suite is part of your day. You start it
in the morning, point your app and your tests at it, and leave it running. It
does its job: it behaves like production. But the day has costs you stop
noticing.

Before the first start, you install Java, because the official Firestore
emulator runs on it. Then the data lives in the Java heap, and the heap grows.
In our benchmark of a real application, two hours of its traffic took the
official emulator from 15.42 GiB of memory to 22.57 GiB.

When you stop it, the data is gone unless you exported it. Keeping it means
`--export-on-exit` at every stop and `--import` at every start. On that
application's data, 211,205 Firestore documents and 6.7 GB in Storage, the
export took 54 to 58 seconds and the next start 30.7 to 31.7 seconds. A crash loses
everything since the last export.

Writes slow down under load, too. With the application running, its listeners
open and its functions firing, the official emulator acknowledged a write in
208 ms at the median.

None of this is a bug. An emulator that keeps its data in memory needs the
memory to hold it and an export to keep it. Firenook is what we built to
remove those costs without changing anything else in your project.

## What Firenook is

**One npm package.** Installing it adds a small launcher, and npm picks the
native engine for your machine from its optional dependencies: macOS on Apple
silicon or Intel, Linux x64 or arm64 with glibc 2.28 or newer, or Windows x64.
Nothing else is downloaded, at install or at start: no Java, no
firebase-tools, no emulator archives. Node runs your Functions, as it does in
production, so the emulators need Node 22, 24 or 26.

**The same project.** Firenook reads `firebase.json` and `.firebaserc` the way
the Firebase CLI does, and serves each emulator on the port you gave it:
Firestore on 8080, Auth on 9099, Storage on 9199, Functions on 5001, Pub/Sub
on 8085, Cloud Tasks on 9499 and Eventarc on 9299 by default. Your client and
Admin SDKs connect unchanged, `connectFirestoreEmulator` and
`FIRESTORE_EMULATOR_HOST` included. It imports and exports the official
format, so your data moves both ways.

**A native engine.** The services are written in Rust, and Firestore keeps its
data on disk, not in a heap. Add `--keep-data` and Firestore, Auth and Storage
come back with all your data at the next start, with no export and no import.
Every acknowledged write is durable within a second;
[how Firenook writes 40× faster](/blog/how-firenook-writes-40x-faster) walks
through how, and how an ordered index answers `orderBy`, ranges and cursors.

**A console.** The Emulator UI's port serves Firenook's console, at
`http://127.0.0.1:4000/console`. It has a page for every service the suite
runs: Firestore and Storage to browse and edit, Auth users with an inbox of
the sign-in codes and email links Auth would have sent, and every function
call with what triggered it, its outcome, its duration and its logs. Pub/Sub,
Cloud Tasks and Eventarc have pages too, where the official UI has only its
log.

**A terminal.** In a terminal, `emulators:start` draws its own screen: the
start-up, a ready summary, and a line for every function call, with the stack
trace when one fails. Press `o` to open the console, `r` to reload your
functions and `q` to stop, which saves your data first.

**A new project in one screen.** `npx firenook init` in an empty folder asks
every question on one screen, with an answer already chosen for each: the
project id, the emulators, TypeScript or JavaScript Functions, and your coding
agent. Then it installs, builds and offers to start the emulators in the same
terminal. `--build` compiles your TypeScript as you save.

**An MCP server.** `firenook mcp` gives a coding agent 54 tools over the
running suite, from Firestore queries to the line of your Security Rules that
denied a request.
[Give your coding agent the emulator](/blog/give-your-agent-the-emulator)
shows a session.

## What we measured

We ran one real application against each emulator in turn, on the same server,
with the same data and two hours of the same traffic. Then we ran each
emulator alone for starts, stops, 26 query shapes and a store of 2.7 million
documents. The official emulator was firebase-tools 15.22.0 on Java 26 with
its default settings, and Firenook ran with its defaults.

| Measured | Official | Firenook |
| --- | ---: | ---: |
| Memory at peak | 22.57 GiB | 2.11 GiB |
| Write, median | 208.2 ms | 5.1 ms |
| Listener update after a write, median | 209 ms | 11 ms |
| Start again with the data | 30.7–31.7 s | 0.59–0.60 s |
| Stop with the data saved | 54–58 s | 0.05–0.26 s |
| orderBy, limit 20, median | 96.3 ms | 12.0 ms |
| Emulator CPU time over the two hours | 1,586 s | 616 s |

Firenook was faster on 25 of the 26 query shapes and tied on the last, 500
document ids with no fields. Queries that order or range-filter a collection
are served from an ordered index: on 2.7 million documents they take 3 to
6 ms, where the official emulator ran out of memory on Java's defaults and
needed a 24 GiB heap and 8 to 28 seconds. Within the Storage cycle, downloads are still a little slower
on Firenook: 2.30 ms against 2.12 ms at the median.

Every figure, the method and its limits are on
[the benchmarks page](/benchmarks). It is one server and one application, so
measure your own workload before you rely on the numbers.

## What it does not do yet

0.2.0 is the first release we ask the public to use. Install it with
`--save-exact` and upgrade on purpose, as you would any tool your tests
depend on. Before a release is published, it passes conformance replays
against recorded behaviour of the official emulator and a packed install on
all five platforms.

Some things are not there yet:

- Realtime Database, Hosting, App Hosting and Data Connect are not emulated. A
  `firebase.json` that configures them still starts, with a warning, and the
  rest of the suite runs.
- There is no `functions:shell`. `firenook functions:invoke` calls any
  function on the running suite instead, background triggers included.
- There is no deploy or login command. Keep firebase-tools for deploying.
- Linux with musl (Alpine) and Windows on Arm are not qualified.

[The compatibility page](/compatibility) records what each service covers and
what it does not.

## Try it in three steps

Install it in your project, next to firebase-tools:

```sh
npm install --save-dev --save-exact firenook
```

Check your project. This reads `firebase.json` the way the Firebase CLI does
and changes nothing:

```console
$ npx firenook init --adopt --dry-run
Firenook init --adopt: ~/demo-shop/firebase.json
  add     give Claude Code the Firenook MCP server: ~/demo-shop/.mcp.json
Dry run: nothing was written.
```

It names any service Firenook skips and any addition it would make, such as a
missing `emulators` entry or the MCP server for the coding agent the project
uses. Without `--dry-run`, it applies the additions, and edits your files as
text, so their formatting stays.

Swap the command. The flags, the ports and the export format stay the same,
so your app and your data need no change:

```diff lang="json"
 "scripts": {
-  "emulators": "firebase emulators:start --import ./data --export-on-exit",
-  "test:integration": "firebase emulators:exec \"npm test\""
+  "emulators": "firenook emulators:start --import ./data --export-on-exit",
+  "test:integration": "firenook emulators:exec \"npm test\""
 }
```

Once that works, you can stop exporting. Replace `--export-on-exit` with
`--keep-data`: the first start imports `./data` into `.firenook/state`, every
later start picks up where you stopped, and `./data` is never written. Add
`.firenook/` to your `.gitignore`.

Going back takes the same steps in reverse. While Firenook runs, export with
`npx firenook emulators:export ./export`, stop it, and start the official CLI
on that export.

## Open source and independent

Firenook is open source under the Apache License 2.0, and the code is at
[github.com/firenook-dev/firenook](https://github.com/firenook-dev/firenook).
It is an independent project, not affiliated with or endorsed by Google.
Firebase, Cloud Firestore and the other product names are trademarks of
Google LLC.

Every change to Firenook is checked against recorded behaviour of the official
emulator, and the differences it keeps on purpose are written down. If you
find one that is not, or anything else that breaks on your project, open an
[issue](https://github.com/firenook-dev/firenook/issues).

To start, [switch an existing project](/docs/get-started/switch) or
[set up a new one](/docs/get-started/new-project).
