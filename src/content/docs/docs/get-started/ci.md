---
title: CI and GitHub Actions
description: Run your integration tests against Firenook in CI. A GitHub Actions workflow, caching, the log CI gets, the Linux glibc requirement, and other CI systems.
---

In CI you run your tests the way you run them on your machine, with
`npx firenook emulators:exec`. A CI machine needs Node 24 and, on Linux,
glibc 2.39 or later. Nothing else: no Java, no firebase-tools, no login.

## GitHub Actions

```yaml title=".github/workflows/integration.yml"
name: Integration tests

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: |
            package-lock.json
            functions/package-lock.json
      - run: npm ci
      - run: npm ci --prefix functions
      - run: npx firenook emulators:exec "npm test"
```

- `setup-node` installs Node 24, which the emulators need to run your
  Functions.
- The first `npm ci` installs Firenook and, from your lockfile, the engine for
  the runner: the lockfile lists every platform's engine, so one written on a
  Mac works here. The second installs your Functions' dependencies.
- `emulators:exec` starts the emulators, runs `npm test`, stops them and exits
  with your tests' exit code, so failing tests fail the job. See
  [run your tests](/docs/get-started/tests).

Firenook has an engine for `ubuntu-latest` (Ubuntu 24.04), `ubuntu-24.04-arm`,
`macos-latest` and `windows-latest`. `ubuntu-22.04` is too old: its glibc is
2.35.

## Caching

`cache: npm` keeps npm's download folder between runs, keyed on the
lockfiles you list. The Linux engine is a download of about 25 MB, and after
the first run it comes from the cache.

There is no need to cache `node_modules`, which `npm ci` removes first, or
`.firenook/`, which holds the working data of one run. When your tests need
data, commit an export and pass `--import`, as in
[start from known data](/docs/get-started/tests#start-from-known-data).

## The log CI gets

In CI, Firenook prints plain lines instead of drawing its terminal screen, and
never checks npm for a newer release (GitHub Actions and most CI systems set
the `CI` variable; `emulators:exec` prints plain lines in any case). A run
looks like this, trimmed:

```text
Firenook: running the script through the shell as the official CLI does; use -- for an argv command without shell interpretation
Firenook 0.2.0-next.8; engine f7c3c663427fd181b0e67b31f960f6e5751b7d12; disk/WAL state <project>/.firenook/runs/session-c5DodU/state
Services: firestore, auth, storage, functions, pubsub; Emulator UI on; host 127.0.0.1
Demo project demo-shop: no cloud service is contacted, but user Functions can still reach external providers; this CLI is not a network sandbox.
Working data and launch receipt are preserved in <project>/.firenook/runs/session-c5DodU. No automatic deletion.
firenook: Starting emulators: auth, functions, firestore, pubsub, storage
firenook functions: Loaded functions definitions from source: helloWorld, orderTotal.
All emulators ready

> demo-shop@1.0.0 test
> node --test

✔ a document reads back as written (53.903208ms)
✔ a new order gets its total (144.6505ms)
firenook suite stopped cleanly: {"functions":2,"schedules":0,"taskQueues":0,"firestoreDocuments":2, …}
```

`All emulators ready` stands on a line of its own: your command starts right
after it. If you start the emulators with `emulators:start` in the background
instead, wait for that line before you connect.

When a run fails and the log is not enough, add `--debug`. Firenook then
writes every log record to `firenook-debug.log` in the run's folder and prints
its path. Upload the runs as an artifact when the job fails:

```yaml
      - run: npx firenook emulators:exec --debug "npm test"
      - if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: firenook-runs
          path: .firenook/runs/
          include-hidden-files: true
```

`include-hidden-files` is needed because `.firenook` starts with a dot.

## Linux needs glibc

Firenook's Linux engine is built on Ubuntu 24.04 and needs glibc 2.39 or
later. glibc is the C library of most Linux distributions. Alpine Linux, and
the `-alpine` Node images built on it, use musl instead.

On a musl system the package manager skips the Linux engine, which declares
that it needs glibc, and every command that needs the engine stops:

```console
$ npx firenook emulators:exec "npm test"
Firenook: Unsupported platform linux-x64. Supported: darwin-arm64, darwin-x64, linux-x64, linux-arm64, win32-x64 (Linux requires glibc). No automatic build/download fallback.
```

Installing glibc compatibility packages on Alpine does not change this. For a
job that runs in a container, pick a glibc image with Node 24 and glibc 2.39
or later:

| Image | Debian | glibc | Enough for Firenook |
| --- | --- | --- | --- |
| `node:24-trixie`, `node:24-trixie-slim` | 13 | 2.41 | Yes |
| `node:24`, `node:24-slim`, `node:24-bookworm` | 12 | 2.36 | No, too old |
| `node:24-alpine` | none (musl) | none | No |

An Ubuntu 24.04 image with Node 24 installed works too.

## Other CI systems

Every CI system runs the same three steps: Node 24, `npm ci` for the project
and its Functions, and `npx firenook emulators:exec`. What differs is where
the job runs and how it caches:

- **Jobs in a container** (GitLab CI, Bitbucket Pipelines, CircleCI's Docker
  executor and others): pick an image from the table above.
- **Caching:** keep npm's cache folder, keyed on your lockfiles, as
  `cache: npm` does on GitHub.
- **The log:** most systems set `CI`; where one does not, `emulators:exec`
  still prints plain lines.

In GitLab CI, for example:

```yaml title=".gitlab-ci.yml"
integration:
  image: node:24-trixie-slim
  variables:
    npm_config_cache: "$CI_PROJECT_DIR/.npm"
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - .npm/
  script:
    - npm ci
    - npm ci --prefix functions
    - npx firenook emulators:exec "npm test"
```

## Several runs on one machine

A self-hosted runner that runs jobs side by side needs two things per job:
its own ports, and its own project id. A running suite records itself in the
system's temporary folder as `hub-<project id>.json`. A second suite with the
same id writes over that file, and the first then ends with an error when it
stops. Give each job its own ports in its copy of `firebase.json`, and its
own id with `--project demo-shop-ci-1` and so on. GitHub-hosted runners give
each job a machine of its own, so this does not arise there.

## Next

Run the emulators in a container with [Docker](/docs/get-started/docker).
