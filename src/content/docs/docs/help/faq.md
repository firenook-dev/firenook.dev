---
title: FAQ
description: Answers to the questions developers ask about Firenook, from firebase-tools and Java to Docker, CI, Windows, versions, data safety, speed and telemetry.
---

Short answers to the questions people ask before and after they switch, with
a link to the page that says more.

## Firenook and the Firebase tools

### Do I still need firebase-tools?

Yes, for deploying and everything else the Firebase CLI does. Firenook
replaces only the emulators and has no deploy or login command. Install it
next to firebase-tools and run your emulators with it.

### Is Firenook made by Google?

No. Firenook is an independent open-source project, not affiliated with or
endorsed by Google. Firebase is a trademark of Google LLC.

### Does my app need changes?

No. Firenook serves every emulator on the port `firebase.json` gives it, the
official defaults when it gives none, so `connectFirestoreEmulator(db,
'127.0.0.1', 8080)`, `FIRESTORE_EMULATOR_HOST` and the rest work as before.
See [connect your app](/docs/get-started/connect).

### Which services does it emulate?

Firestore, Authentication, Cloud Storage, Cloud Functions, Extensions,
Pub/Sub, Cloud Tasks and Eventarc. Realtime Database, Hosting, App Hosting
and Data Connect are not emulated; a `firebase.json` that configures them
still starts, with a warning. [Compatibility](/compatibility) records what
each service covers and what it does not.

### Can I go back to the official emulator?

Yes. Firenook imports and exports the official format. While Firenook runs,
export with `npx firenook emulators:export ./export`, stop it, and start the
official CLI with `--import ./export`. Never run both on the same ports or in
the same working directory.

### Is it faster at everything?

No. On a real application's two-hour workload, Firenook answered writes in
5.3 ms against 203 ms at the median, peaked at 2.16 GiB of memory against
19.56 GiB, and used 61% less CPU. But of 26 query shapes measured on their
own, the official emulator was faster on 6: ordering or range filters over a
large collection, and reading many documents by key. See
[benchmarks](/benchmarks) for the method and every figure.

## Installing and running

### Does Firenook need Java?

No. Its services are native code in one npm package, with an engine for
macOS, Linux and Windows, and nothing else is downloaded at install or start.
Node runs your Functions, as it does in production. See
[the Java 21 error](/docs/help/java).

### Which Node version do I need?

Node 24 to run the emulators, because your Functions run on the same Node.
`init`, `--version` and the other commands run on any Node from 20 up.

### Does it run on Windows?

On Windows x64, natively. Windows on Arm and 32-bit Windows are not
supported. See [Windows](/docs/help/windows).

### Which package managers work?

Every release is installed with npm and with Bun in its checks, on all five
platforms. Whatever you use, keep optional dependencies enabled: the engine
for your machine comes in one.

### Does it run in Docker?

There is no official image. In a container Firenook is the Linux package,
which needs glibc 2.39 or newer. Use an image built on Debian 13, Ubuntu 24.04
or later, such as `node:24-trixie-slim`. The default `node:24` and
`node:24-slim` images are built on Debian 12, whose glibc is too old, and
Alpine and other musl-based images are not supported at all. See
[Docker](/docs/get-started/docker).

### Can I use it in CI?

Yes. `npx firenook emulators:exec "npm test"` starts the emulators, runs your
tests once every emulator is ready, stops, and passes on the tests' exit
code. In CI Firenook prints the plain log and skips its release check.
Vendor any registry Extensions first, so CI needs no login. See
[CI and GitHub Actions](/docs/get-started/ci).

### Can I run two projects at once?

Yes, each on its own ports. Two copies of the same project, such as two Git
worktrees, also need their own project ids (`--project demo-shop-feature`) and
their own saved data: commands such as `emulators:export` find a running
suite by its project id, and one state directory serves one run at a time.
See [troubleshooting](/docs/help/troubleshooting#a-command-reaches-the-wrong-emulators).

### Is it ready for my team?

Firenook is in preview: its releases are `0.2.0-next` versions on npm. Every
release passes conformance replays against the official emulator and packed
installs on all five platforms. Pin an exact version and upgrade on purpose.

### Which version should I install, and how do I upgrade?

Install the latest release at an exact version
(`npm install --save-dev --save-exact firenook`). Firenook never upgrades
itself; in a terminal, its start-up screen says when a newer release is out.
Stop the emulators before you upgrade. See
[versions and verification](/docs/help/versions).

### Is it free?

Yes. Firenook is open source under the Apache License 2.0.

## Your data

### Where is my data kept?

In `.firenook/` in your project. Without `--keep-data`, every start gets a new
empty folder, `.firenook/runs/session-*/state`; earlier runs stay on disk and
are never loaded again. With `--keep-data`, the data lives in
`.firenook/state` and every start picks it up where you left it. Firenook
never deletes either: remove old `session-*` folders yourself when you no
longer need them, and add `.firenook/` to `.gitignore`. See
[keep data between runs](/docs/data/keep-data).

### Is my data safe if Firenook or my computer crashes?

Firenook acknowledges a write once it is in its journal, and syncs the
journal to the disk once a second and when it stops. If the process is
killed, no acknowledged write is lost. A kernel crash or a power cut can lose
the last second of writes, and the data stays consistent.
`--durability per-commit` syncs every write before acknowledging it, at the
cost of the disk's flush time on each write. Recovery after a power cut on
Windows, and data on network drives, have not been tested.

It is still an emulator for development. Keep data you care about in an
export, and never put production data in it. See
[recovery after a crash](/docs/data/recovery).

### Does emulators:export need the emulators running?

Yes. It asks the running emulators for the export, as the official command
does, and stops when it finds none:

```console
$ npx firenook emulators:export ./data2
Firenook: Did not find a running emulator hub for project demo-proj (tried http://127.0.0.1:31501): ECONNREFUSED. Start it with firenook emulators:start.
```

To export when the emulators stop, start them with `--export-on-exit`. See
[export and snapshots](/docs/data/export).

### Can I use the exports I already have?

Yes. `--import` reads the official export format, and what Firenook exports,
the official emulator imports.

## Network, privacy and diagnostics

### Does Firenook send telemetry?

No. Firenook sends no usage data, and the console loads nothing from the
internet. Three things can use the network: the release check, which asks
the npm registry for Firenook's version tags at most once a day in a
terminal; an Extension from the registry, on its first start; and your own
functions' code. Set `FIRENOOK_NO_UPDATE_CHECK=1` to turn the release check
off. See [without a Google login](/docs/help/no-login).

### What does --no-diagnostics turn off?

By default Firenook keeps, in memory on your machine, a bounded history of
the requests the Security Rules decided, with each decision, plus rules
coverage and the request and response bodies of Authentication calls. The
console's Rules pages, Firestore's coverage report and the MCP tool for rule
denials read it. The plain log says so at start:

```text
firenook local diagnostics enabled: bounded request/coverage values may include document data and decoded auth claims; do not publish consumer reports
```

`--no-diagnostics` turns that recording off. The coverage report then answers
`Coverage diagnostics are disabled`, and the console's decisions feeds say
why they are empty. Diagnostics never leave your machine either way.

### Does Firenook need a Google login?

No. Use a `demo-` project id and nothing reaches a real Firebase project. The
only exception is the first download of an Extension from the registry, and
`npx firenook ext:vendor` keeps even that from needing a login again. See
[without a Google login](/docs/help/no-login).

### Can other devices reach the emulators?

Not by default: every emulator listens on `127.0.0.1`. With `--host
0.0.0.0` or another network address they can, and Firenook warns at start
that the emulators have no authentication, so anyone who can reach that
address can read your data and run your functions.

## Next

Something not working? [Troubleshooting](/docs/help/troubleshooting) lists
the messages Firenook prints and how to fix each one.
