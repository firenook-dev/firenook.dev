---
title: Introducing Firenook
description: Firenook runs the Firebase emulators from one npm package, with your firebase.json, SDKs and ports, no Java, and data that survives restarts.
date: 2026-10-21
---

Firenook is a drop-in replacement for the Firebase Local Emulator Suite. It
reads your `firebase.json`, listens on the same ports and keeps your data
between runs. This post explains why it exists, what it does today, what it
does not do yet, and how to try it on your project in three steps.

## A day with the emulator

If you build on Firebase, the emulator suite is part of your day. You start it
in the morning, point your app and your tests at it, and leave it running. It
does its job: it behaves like production. But the day has costs you stop
noticing.

Before the first start, you install Java, because the official Firestore
emulator runs on it. Then the data lives in the Java heap, and the heap grows.
In our benchmark of a real application, two hours of its traffic took the
official emulator from 14.12 GiB of memory to 19.14 GiB, with a peak of
19.56 GiB.

When you stop it, the data is gone unless you exported it. Keeping it means
`--export-on-exit` at every stop and `--import` at every start. On that
application's data, 211,205 Firestore documents and 6.7 GB in Storage, the
export took 50 to 57 seconds and the next start 21.6 to 23.6 seconds. A crash
loses everything since the last export.

Writes slow down under load, too. With the application running, its listeners
open and its functions firing, the official emulator acknowledged a write in
203 ms at the median.

None of this is a bug. An emulator that keeps its data in memory needs the
memory to hold it and an export to keep it. Firenook is what we built to
remove those costs without changing anything else in your project.

## What Firenook is

**One npm package.** Installing it adds a small launcher, and npm picks the
native engine for your machine from its optional dependencies: macOS on Apple
silicon or Intel, Linux x64 or arm64 with glibc, or Windows x64. Nothing else
is downloaded, at install or at start: no Java, no firebase-tools, no emulator
archives. Node runs your Functions, as it does in production, so the
emulators need Node 24.

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
[how Firenook writes 38× faster](/blog/how-firenook-writes-38x-faster) walks
through how.

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

**An MCP server.** `firenook mcp` gives a coding agent 54 tools over the
running suite, from Firestore queries to the line of your Security Rules that
denied a request.
[Give your coding agent the emulator](/blog/give-your-agent-the-emulator)
shows a session.

## What we measured

We ran one real application against each emulator in turn, on the same server,
with the same data and two hours of the same traffic. Then we ran each
emulator alone for starts, stops and 26 query shapes. The official emulator
was firebase-tools 15.22.0 on Java 26 with its default settings; Firenook was
0.2.0-next.6 with its defaults.

| | Official | Firenook |
| --- | ---: | ---: |
| Memory at peak | 19.56 GiB | 2.16 GiB |
| Write, median | 202.8 ms | 5.3 ms |
| Listener update after a write, median | 203 ms | 11 ms |
| Start again with the data | 21.6–23.6 s | 0.54–0.57 s |
| Stop with the data saved | 50–57 s | 0.04–0.30 s |
| Emulator CPU time over the two hours | 1,597 s | 625 s |

The official emulator is ahead in places. It answered 6 of the 26 query
shapes faster: ordering and range filters over a large collection, and batch
gets of many documents. Firenook also writes more to the disk, 1.97 GB against
1.24 GB for the whole server over the two hours, because it makes every write
durable instead of waiting for an export.

Every figure, the method and its limits are on
[the benchmarks page](/benchmarks). It is one server and one application, so
measure your own workload before you rely on the numbers. The two releases
since 0.2.0-next.6 changed no write or query path.

## What it does not do yet

Firenook is in preview. Releases are `0.2.0-next` versions, and a preview can
change between releases, so install with `--save-exact` and upgrade on
purpose. Before a release is published, it passes conformance replays against
recorded behaviour of the official emulator and a packed install on all five
platforms.

Some things are not there yet:

- Realtime Database, Hosting, App Hosting and Data Connect are not emulated. A
  `firebase.json` that configures them still starts, with a warning, and the
  rest of the suite runs.
- There is no `functions:shell`. `firenook functions:invoke` calls any
  function on the running suite instead, background triggers included.
- There is no deploy or login command. Keep firebase-tools for deploying.
- Linux with musl and Windows on ARM are not qualified.

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
  ok      nothing to change; services: firestore, auth, storage, functions, pubsub
```

It names any service Firenook skips and any addition it would make, such as a
missing `emulators` entry. Without `--dry-run`, it applies the additions.

Swap the command. The flags, the ports and the export format stay the same,
so your app and your data need no change:

```diff
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
