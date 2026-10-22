---
title: Build from source
description: Build Firenook's engine and console from source, run the tests, and try your build in your own project before anything is published.
---

To use Firenook, install it from npm. Build it from source when you want to
fix a bug, try a change or read the code running. This page covers what you
need, how to build the console and the engine, how to try a build in your own
project, and which tests a change must pass.

## What you need

- **Rust**, the toolchain `rust-toolchain.toml` names: the stable channel with
  `clippy` and `rustfmt`. The workspace needs Rust 1.98 or later, and 0.2.0
  was built with 1.98.0, the toolchain the release records.
- **Node 24.20.0 and npm 12.0.2**, the versions `CONTRIBUTING.md` names and
  the repository's checks pin: `console/` and `conformance/` declare
  `engines.node` `>=24.20.0 <25` and `packageManager` `npm@12.0.2`.
- **Chrome or Chromium**, for the browser tests only.
- **Docker**, only to build a Linux engine that runs on older systems (see
  [below](#a-linux-engine-for-older-systems)).
- **Java and firebase-tools 15.22.0**, only to record new fixtures from the
  official emulator. Firenook itself runs neither.

The emulators you build run your functions on Node 22, 24 or 26, whichever
runs them, as the published package does.

Get the code and turn on the repository's Git hooks:

```sh
git clone https://github.com/firenook-dev/firenook.git
cd firenook
git config core.hooksPath .githooks
```

## Build the console

The engine serves the console from `console/dist`. Release builds embed it in
the binary; debug builds read it from disk. Build it first:

```sh
node packaging/build-console.mjs
```

This runs `npm ci` and `npm run build` in `console/` from the pinned
lockfile. Without a console build the engine still compiles, and the console
page says a build is needed.

## Build the engine

```sh
cargo build --locked --release --bin firenook
```

The binary is `target/release/firenook` (`firenook.exe` on Windows). It is
the engine on its own, without the npm launcher's checks. Its `suite` command
is what the launcher runs; one service can also run alone, for example
Firestore with its rules:

```sh
cargo run -p firenook -- firestore --diagnostics --rules firestore.rules
```

### A Linux engine for older systems

On Linux, `cargo build` links the engine against the build machine's glibc,
so the engine needs that version or a newer one. The published Linux
engines are linked against glibc 2.28 in the `manylinux_2_28` image, so
they start on RHEL 8, Debian 10, Ubuntu 20.04, `node:24-slim` and later.
To build one the same way, on Linux x64 or arm64 with Docker:

```sh
rustup toolchain install 1.98.0 --profile minimal
node packaging/cargo-glibc.mjs 1.98.0 build --locked --release --bin firenook
```

`cargo-glibc.mjs` runs the cargo command inside that image, with your Rust
toolchain mounted read-only and the repository at its own path, so the
binary lands in `target/release` as usual. CI then starts the packed engine
in AlmaLinux 8, Debian 11, Ubuntu 22.04 and `node:24-slim` containers, and
checks that Alpine and Amazon Linux 2 are refused with a message that says
what they lack.

## Try your build in a project

To run a change in your own app through the npm launcher, build a local
candidate. It is a pair of private tarballs, the launcher and your machine's
engine, with a version of their own that names the commit, such as
`0.2.0-local.g1a2b3c4d5e6f`. Nothing is published.

1. Commit your change. The build refuses uncommitted tracked changes, so
   every candidate names the exact source it came from.
2. Build the candidate into a new folder:

   ```sh
   node packaging/build-local.mjs /absolute/path/to/new-folder
   ```

3. Stop the emulators in your project. Never replace the package while they
   run.
4. Point your project at both tarballs, by the exact paths the build
   printed, and install:

   ```json title="package.json"
   {
     "devDependencies": {
       "firenook": "file:/absolute/path/to/cli.tgz",
       "@firenook/cli-darwin-arm64": "file:/absolute/path/to/native.tgz"
     }
   }
   ```

   Use your platform's package name. With Bun, edit these lines and run
   `bun install`, rather than `bun add`.
5. Check that `npx firenook --version` prints the local version and your
   commit, then start the emulators as usual. Saved data is data: keep it,
   and do not delete it to switch versions.
6. When you are done, stop the emulators and restore `package.json` and the
   lockfile, without committing the `file:` lines.

`node packaging/smoke-packed.mjs <folder> npm` (or `bun`) installs a
candidate into a throwaway project and checks it.

## Run the tests

The Rust workspace:

```sh
cargo fmt --all -- --check
cargo clippy --locked --workspace --all-targets --all-features -- -D warnings
cargo test --locked --workspace --all-targets --all-features
```

The conformance harness, which replays recordings of the official emulator
against Firenook:

```sh
npm ci --prefix conformance
npm run check --prefix conformance
npm test --prefix conformance
npm run test:firenook:disk --prefix conformance
```

The packaging checks:

```sh
node --test packaging/*.test.mjs
```

The console has its own checks: `npm run check`, `lint`, `format:check`,
`test` and `budget`, each with `--prefix console`, and browser journeys with
`npm run test:e2e --prefix console`. `console/README.md` explains how to run
the console against a test engine with live reload. The test engine runs the
Functions on the Node that runs the script, or on the one `FIRENOOK_NODE`
names; CI runs the Functions journeys again with the Functions on Node 22
and 26, while the console's build and the browser stay on 24.20.0.

## How a change moves

A change to emulator behaviour starts from the official emulator. Record its
behaviour as a synthetic fixture under `conformance/fixtures` first, then
change Firenook until the replay passes. Never weaken a threshold, drop an
assertion or widen an allowlist to make a replay pass; record a deliberate
difference with its reason instead. CI then runs everything above, the
browser SDK tests and the packed installs on all five platforms.

Use made-up data in fixtures and tests. The repository never names private
applications, hosts, people or paths, and `node scripts/check-independence.mjs`
checks every file and commit message for them.

Contributions are under the Apache License 2.0, section 5, and you confirm
you have the right to submit them. The Firenook name and mark are not
licensed with the code; see [trademark](/trademark).
[CONTRIBUTING.md](https://github.com/firenook-dev/firenook/blob/main/CONTRIBUTING.md)
has the full rules.

## Next

[Architecture](/docs/contribute/architecture) maps the crates, the launcher
and the console.
