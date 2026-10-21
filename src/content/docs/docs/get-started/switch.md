---
title: Switch from the Firebase emulators
description: Move a project from the official Firebase emulators to Firenook by changing one word. Your config, rules, Functions code, app and data stay as they are.
---

Firenook is a drop-in replacement. Your `firebase.json`, `.firebaserc`, rules
and indexes, Functions code and app stay exactly as they are, and
firebase-tools stays installed for deploying.

## 1. Check your project

Nothing changes until you drop `--dry-run`:

```console
$ npx firenook init --adopt --dry-run
  skip    Firenook: firebase.json configures the hosting emulator, which Firenook does not implement; skipping it.
  ok      nothing to change; services: firestore, auth, storage, functions
```

`init --adopt` reads your `firebase.json` the way the official CLI does and
prints a plan: errors Firenook cannot accept, services it skips (Realtime
Database, Hosting, App Hosting, Data Connect) and the additions it can make,
such as a missing `emulators` entry. `npx firenook init --adopt` applies the
additions by editing the parsed JSON, never rewriting your other keys.
`npx firenook doctor` runs the same checks plus the package and Node,
read-only, as JSON.

## 2. Swap the command

`firebase emulators:start` becomes `firenook emulators:start`, and
`firebase emulators:exec` becomes `firenook emulators:exec`. The common flags
carry over: `--only`, `--project`, `--import`, `--export-on-exit` and
`--inspect-functions`.

```diff lang="json"
 "scripts": {
-  "emulators": "firebase emulators:start --import ./data --export-on-exit",
-  "test:integration": "firebase emulators:exec \"npm test\""
+  "emulators": "firenook emulators:start --import ./data --export-on-exit",
+  "test:integration": "firenook emulators:exec \"npm test\""
 }
```

Firenook reads and writes the official export format, so `--import` takes the
data you already have, and every emulator listens on the port `firebase.json`
gives it. Your app needs no change: `connectFirestoreEmulator(db, '127.0.0.1', 8080)`,
`FIRESTORE_EMULATOR_HOST` and the rest work as before.

## 3. Keep your data without exporting

This step is optional. Instead of an import at every start and an export at
every stop, replace `--export-on-exit` with `--keep-data`. The first start
imports `./data` into `.firenook/state`, every later start picks the data up
where you left it, and `./data` itself is never written:

```sh
npx firenook emulators:start --import ./data --keep-data
```

## What is different

- `functions:shell` is `firenook functions:invoke`, which calls any function
  on the running suite, background triggers included.
- Realtime Database, Hosting, App Hosting and Data Connect are not emulated. A
  `firebase.json` that configures them still starts, with a warning.
- Google's Emulator UI is replaced by Firenook's console, on the same UI port.
  Its old page addresses lead to the matching console page.

## Going back

Stop Firenook (it saves first), export with
`npx firenook emulators:export ./export` while it runs or with
`--export-on-exit`, and start the official CLI on that export. Never run both
on the same ports or in the same working directory.
