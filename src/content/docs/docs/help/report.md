---
title: Report a problem
description: 'How to report a Firenook bug so it can be fixed: where to open an issue, what to include, and how to report a security problem privately.'
---

Firenook's bugs and feature requests live in the
[GitHub issues](https://github.com/firenook-dev/firenook/issues). This page
says what to put in an issue so the problem can be reproduced and fixed,
and where to send a security problem instead.

Search the open and closed issues first: someone may have reported it, and
[troubleshooting](/docs/help/troubleshooting) may already have the fix.

## What to include

### The version

```console
$ npx firenook --version
0.2.0-next.8 (engine source f7c3c663427fd181b0e67b31f960f6e5751b7d12)
```

Include the whole line: the engine revision says exactly which engine you
ran. If you can, say whether the latest release still has the problem.

### Your system

Name the operating system and its version, the processor (Apple silicon,
Intel or AMD x64, arm64), the Node version (`node --version`), and the
package manager you installed with.

### What Firenook read

`doctor` prints, as JSON, how Firenook reads your project: the
`firebase.json` it found, the project id, the services it starts, every
port, and each Extension with where its source comes from. It changes
nothing.

```sh
npx firenook doctor
```

It includes your `firebase.json` and full paths, which contain your user
name. Read it before you paste it, and shorten what you want to keep
private.

### The log

Run the failing command with `--debug`. Firenook writes the engine's full
log to the run's folder and prints where:

```console
$ npx firenook emulators:start --plain --debug --only firestore
Firenook 0.2.0-next.8; engine f7c3c663427fd181b0e67b31f960f6e5751b7d12; disk/WAL state ~/demo-shop/.firenook/runs/session-NEFoaj/state
Services: firestore; Emulator UI on; host 127.0.0.1
Demo project demo-proj: no cloud service is contacted, but user Functions can still reach external providers; this CLI is not a network sandbox.
Debug log: ~/demo-shop/.firenook/runs/session-NEFoaj/firenook-debug.log
```

Attach that file, and the output of the same command. `--plain` prints the
plain log instead of the terminal screen, which is easier to paste. The same
folder holds `launch.json`, a record of the version, the arguments and the
services of that run.

### A small project that shows it

The fastest fix starts from a project anyone can run:

- a `firebase.json` with only the services involved;
- the rules, indexes and the smallest function that show the problem;
- a `demo-` project id, such as `demo-shop`;
- the steps, from `npx firenook emulators:start` to the wrong result;
- what you expected, and what happened instead.

Use made-up data. If the official emulator behaves differently on the same
project, say how: Firenook aims to answer as it does, so a difference is a
bug in itself.

## What never to include

Do not paste secrets, service account keys, `.env` or `.secret.local` files,
real user data, or exports of a production project. Logs hold whatever your
functions print, the console's request history can hold document data and
decoded sign-in claims, and `doctor` output holds your paths: check what you
share.

## Security problems

Do not open a public issue for a security problem. See [security](/security)
for how to report it privately.

## Next

To fix it yourself, see [build from source](/docs/contribute/build).
