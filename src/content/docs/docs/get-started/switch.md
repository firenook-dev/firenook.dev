---
title: Switch from the Firebase emulators
description: Move a project from the official Firebase emulators to Firenook by changing one word. Your config, rules, Functions code, app and data stay as they are.
---

Firenook is a drop-in replacement. Your `firebase.json`, `.firebaserc`, rules
and indexes, Functions code and app stay as they are, and firebase-tools stays
installed for deploying. This page takes an existing project across in three
steps, after you [install Firenook](/docs/get-started/install).

## 1. Check your project

`init --adopt` reads your `firebase.json` the way the official CLI does and
prints a plan. Nothing changes while you pass `--dry-run`:

```console
$ npx firenook init --adopt --dry-run
Firenook init --adopt: ~/demo-shop/firebase.json
  skip    Firenook: firebase.json configures the hosting emulator, which Firenook does not implement; skipping it.
  ok      nothing to change; services: firestore, auth, storage, functions
```

The plan has three kinds of line:

| Line | Means |
| --- | --- |
| `error` | Firenook cannot start with this configuration, for example an unknown key under `emulators` |
| `skip` | A service Firenook does not emulate (Realtime Database, Hosting, App Hosting, Data Connect), or a warning about the configuration |
| `add` | Something Firenook can add for you |

The additions are a missing `emulators` entry for a service the file
configures, a missing project id in `.firebaserc`, a rules or indexes file
that `firebase.json` names but that does not exist, and the MCP server for a
coding agent the folder shows. A project with gaps gets a plan like this one:

```console
$ npx firenook init --adopt --dry-run
Firenook init --adopt: ~/demo-shop/firebase.json
  skip    Firenook: firebase.json configures the hosting emulator, which Firenook does not implement; skipping it.
  skip    Firenook: firebase.json configures the database emulator, which Firenook does not implement; skipping it.
  add     add emulators.storage {port: 9199}
  add     set .firebaserc projects.default = demo-shop (create the file)
  add     write Storage rules (official init template): ~/demo-shop/storage.rules
Dry run: nothing was written.
```

Run `npx firenook init --adopt` without `--dry-run` to apply the additions. It
keeps every key and value you have and adds its own, then writes
`firebase.json` back with two-space indentation. When the plan has an error,
it writes nothing and exits with code 1:

```console
$ npx firenook init --adopt
Firenook init --adopt: ~/demo-shop/firebase.json
  error   Unsupported configured emulator: bogus. Valid emulators keys are firestore, auth, storage, functions, pubsub, hub, ui, logging, eventarc, tasks, extensions, singleProjectMode, database, hosting, dataconnect, apphosting.
Fix the errors above, then re-run firenook init --adopt; nothing was written.
```

`npx firenook doctor` runs the same checks plus the engine and Node. It
changes nothing and prints the result as JSON.

## 2. Swap the command

`firebase emulators:start` becomes `firenook emulators:start`, and
`firebase emulators:exec` becomes `firenook emulators:exec`. The common flags
carry over: `--only`, `--project`, `--import`, `--export-on-exit`,
`--inspect-functions`, and `--ui` for `emulators:exec`.

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

Keep `--import ./data` in the command. Data that began from a seed remembers
it, and a start without that `--import` is refused, with the data left as it
was. [Keep data between runs](/docs/data/keep-data) has the details.

## What is different

- **Node 24, no Java.** The emulators need Node 24, since your Functions run
  on it. Nothing else is installed or downloaded.
- **`functions:shell`** is `firenook functions:invoke`, which calls any
  function on the running suite, background triggers included.
- **Not emulated:** Realtime Database, Hosting, App Hosting and Data Connect.
  A `firebase.json` that configures them still starts, with a warning.
- **The console** replaces Google's Emulator UI, on the same UI port, at
  `http://127.0.0.1:4000/console`. The old page addresses, such as
  `/firestore` or `/auth`, lead to the matching console page.
- **The terminal.** In a terminal, `emulators:start` draws its own screen in
  place of the official banner and table. Pipes and CI get plain lines, with
  `All emulators ready` on a line of its own.
- **One host for the whole suite.** Every emulator listens on the same
  address. Per-service `host` values in `firebase.json` must match (loopback
  names aside), and `--host` sets the address for all of them.
- **Working files stay.** Each start keeps its working files in
  `.firenook/runs/`, and Firenook never deletes them. Add `.firenook/` to your
  `.gitignore`, and remove old runs when you no longer need them.
- **`emulators:exec`** sets the emulator variables for Firestore, Auth,
  Storage, Pub/Sub and the hub, but not `CLOUD_TASKS_EMULATOR_HOST` or
  `CLOUD_EVENTARC_EMULATOR_HOST`. [Run your tests](/docs/get-started/tests)
  lists them.
- **`--log-verbosity`** is accepted for compatibility, and Firenook prints its
  full log whatever the level, except `DEBUG`, which works like `--debug`.

## Going back

Stop Firenook (it saves first), export with
`npx firenook emulators:export ./export` while it runs or with
`--export-on-exit`, and start the official CLI on that export. Never run both
on the same ports or in the same working directory.

## Next

[Connect your app](/docs/get-started/connect) if it is not connected yet, or
[run your tests](/docs/get-started/tests) against Firenook.
