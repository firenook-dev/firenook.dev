---
title: Install Firenook
description: Add Firenook to a project with npm or Bun, check that your machine can run it, and start every emulator with one command.
---

Firenook is one npm package. Install it in your project, next to
firebase-tools if you have it: keep that for deploying, since Firenook has no
deploy or login command.

```sh
npm install --save-dev --save-exact firenook
```

With Bun:

```sh
bun add --dev --exact firenook
```

`--save-exact` keeps you on the release you installed until you upgrade on
purpose. Firenook is in preview, and a preview can change between releases.

## What it needs

Firenook needs **Node 24**, because Node runs your Functions, as it does in
production. It runs on:

- macOS, on Apple silicon or Intel
- Linux, x64 or arm64, with glibc
- Windows x64

The package is a small launcher. npm or Bun picks the native engine for your
machine from its optional dependencies, so keep optional dependencies enabled.
Nothing else is downloaded, at install or at start: no Java, no firebase-tools,
no emulator archives. The one exception is an Extension from the registry,
which is fetched once, on first use; `firenook ext:vendor` copies it into the
project so that even that works offline.

Every run keeps its working data under `.firenook/`, so add that folder to
your `.gitignore`.

## Start the emulators

In a project that already has a `firebase.json`:

```sh
npx firenook emulators:start
```

Starting from nothing, `init` sets up a project first:

```sh
npx firenook init
cd functions && npm install && cd ..
npx firenook emulators:start --keep-data
```

`init` writes `firebase.json` with every emulator on its usual port,
`.firebaserc` with a `demo-<folder>` project, the default Firestore and Storage
rules and indexes, and a JavaScript Functions codebase. A `demo-` project id
never reaches a real Firebase project. It installs nothing, and never
overwrites an existing `firebase.json` unless you pass `--force`.

In a terminal you get a live screen: the start-up, the ready summary and a
line for every function call. Press `o` to open the console, `r` to reload
your functions, and `q` to stop, which saves the data first. The console is at
`http://127.0.0.1:4000/console`.

## Next

Already running the official emulator? [Switch over](/docs/get-started/switch)
in three steps.
