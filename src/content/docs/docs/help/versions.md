---
title: Versions and verification
description: How Firenook releases are numbered and tagged, how to pin and upgrade one, and how to check that what you installed is what was published.
---

This page explains how Firenook's releases are numbered and tagged, how to
install one on purpose, and how to check the package and the engine you have.

## Releases

The current release is `0.2.0`, the first for public use. Before it came the
previews, `0.2.0-next.1` to `0.2.0-next.8`. Each release is listed, with what
it changed and what it passed, on the
[releases page](https://github.com/firenook-dev/firenook/releases) and in the
[changelog](/changelog).

Releases before the rename were published as `@fireside-dev/cli`, up to
`0.1.0-next.9`; see [former name](/docs/help/former-name). `firenook@0.0.0`
only held the name before the first release and contains no emulator.

## Channels

npm has two tags for Firenook. `latest` is the release to install, `0.2.0`
today; `npm install firenook` and a bare `npx firenook` get it on any Node
from 20 up. `next` carries previews, which keep their own `-next` versions.
`npm view firenook dist-tags` shows where each tag points.

## Pin a version

Install an exact version, so every machine and every CI run gets the same
one until you upgrade on purpose:

```sh
npm install --save-dev --save-exact firenook@0.2.0
```

With Bun:

```sh
bun add --dev --exact firenook@0.2.0
```

Commit the lockfile with it. Firenook never upgrades itself. In a terminal,
it asks the npm registry for the version tags at most once a day, in the
background, and the next start shows a newer release on your channel with
the install command for your package manager. The check is off in CI, in the
plain output, and with `FIRENOOK_NO_UPDATE_CHECK=1` or `NO_UPDATE_NOTIFIER=1`.

To upgrade, stop the emulators first, then install the new exact version.
Never replace the package while the emulators run. Saved data stays where it
is, and each release's notes say whether it changes how data is stored.

## Data between releases

Data kept with `--keep-data` moves between `0.2.0` and the last preview in
both directions:

- The first `0.2.0` start of data an earlier release saved builds the
  ordered field index once, with one read of every document: 7.4 s for
  211,202 documents and 49 s for 2.7 million on the benchmark server. Every
  start after that opens the data at once.
- `0.2.0-next.8` opens data `0.2.0` saved, and rebuilds its own index the
  same way on its first start.

The plain log says when the index is built:

```text
firenook: indexed the top-level fields of 1000 Firestore documents in 0.0 s
```

## What you installed

The `firenook` package is a small launcher. The engine, the native program
that serves the emulators, comes in a second package for your platform, such
as `@firenook/cli-darwin-arm64`. Both carry the same version, and the engine
is built from one exact commit of the engine repository. `--version` prints
both:

```console
$ npx firenook --version
0.2.0 (engine source 7a9614bea49f8208f96d2126b29ef11ee2f2810b)
```

The launcher records the engine it expects in `release.json`:

```json title="node_modules/firenook/release.json"
{
  "engineRevision": "7a9614bea49f8208f96d2126b29ef11ee2f2810b",
  "rustToolchain": "1.98.0",
  "platforms": {
    "darwin-arm64": "aarch64-apple-darwin",
    "darwin-x64": "x86_64-apple-darwin",
    "linux-x64": "x86_64-unknown-linux-gnu",
    "linux-arm64": "aarch64-unknown-linux-gnu",
    "win32-x64": "x86_64-pc-windows-msvc"
  }
}
```

The platform package carries a receipt with the SHA-256 of its binary, here
cut short:

```json title="node_modules/@firenook/cli-darwin-arm64/receipt.json"
{
  "version": "0.2.0",
  "platform": "darwin-arm64",
  "target": "aarch64-apple-darwin",
  "engineRevision": "7a9614bea49f8208f96d2126b29ef11ee2f2810b",
  "sha256": "…"
}
```

## Check the engine with binary-path

Before every start, the launcher checks that the platform package matches
it: the package name and version, the receipt's engine revision, platform
and target, and the binary's SHA-256. `binary-path` runs the same check and
prints where the binary is:

```console
$ npx firenook binary-path
~/demo-shop/node_modules/@firenook/cli-darwin-arm64/bin/firenook
```

When something does not match, it refuses, and so does every command that
starts the engine:

```text
Firenook platform package identity mismatch; reinstall the pinned CLI and its optional dependencies.
Firenook binary checksum mismatch; refusing execution.
```

Tools can run the same check from code: `import { binaryPath } from
'firenook/binary'`.

## Provenance and signatures

Releases are published from the engine repository's GitHub Actions, with npm
provenance. npm can check the registry signatures and the provenance
attestations of what you installed:

```console
$ npm audit signatures
audited 2 packages in 0s

2 packages have verified registry signatures

2 packages have verified attestations
```

The receipts above are integrity checks between the launcher and the engine.
They do not replace npm's provenance or your lockfile.

## What a release has passed

Each release on GitHub, tagged `npm-v0.2.0` and so on, names its
engine revision and the CI runs it passed, and carries:

- the published tarballs, the launcher's and each platform's;
- a manifest per platform with each tarball's SHA-256 and npm integrity;
- the results of installing the packed packages with npm and with Bun, and of
  running the whole suite from them, on all five platforms;
- `release-source.json`, which names the build and publication run.

You can compare what npm serves with the manifest. `npm pack` downloads the
tarball, and its SHA-256 must match the manifest's:

```sh
npm pack firenook@0.2.0
shasum -a 256 firenook-0.2.0.tgz
```

A platform is supported for a release only when that release's run passed on
it. Behaviour is pinned to recordings of the official emulator that every
change replays. The performance figures come from a recorded run whose
record is linked from [benchmarks](/benchmarks).

## Next

Moving from the packages published as Fireside? See
[former name](/docs/help/former-name).
