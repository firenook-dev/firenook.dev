---
title: CI and GitHub Actions
description: Run your integration tests against Firenook in CI. A GitHub Actions workflow, caching, the log CI gets, the Linux glibc requirement, and other CI systems.
---

In CI you run your tests the way you run them on your machine, with
`npx firenook emulators:exec`. A CI machine needs Node 22, 24 or 26 and, on
Linux, glibc 2.28 or later. Nothing else: no Java, no firebase-tools, no
login.

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
      - run: npx firenook emulators:exec --build "npm test"
```

- `setup-node` installs Node 24. The emulators run your Functions on it, so
  use the Node your Functions target: 22, 24 or 26.
- The first `npm ci` installs Firenook and, from your lockfile, the engine for
  the runner: the lockfile lists every platform's engine, so one written on a
  Mac works here. The second installs your Functions' dependencies.
- `--build` compiles a TypeScript codebase first, since `lib/` is not
  committed, and fails the job without running the tests when it does not
  compile. A JavaScript codebase has no build script, and `--build` leaves
  it as it is.
- `emulators:exec` starts the emulators, runs `npm test`, stops them and exits
  with your tests' exit code, so failing tests fail the job. See
  [run your tests](/docs/get-started/tests).

Firenook runs on `ubuntu-latest`, `ubuntu-24.04`, `ubuntu-22.04`,
`ubuntu-24.04-arm`, `macos-latest` and `windows-latest`.

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
Firenook 0.2.0; engine bbd437e754a4c14c5ab5d37e01843930f5a9bade; disk/WAL state <project>/.firenook/runs/session-Syhid2/state
Services: firestore, auth, storage, functions, pubsub; Emulator UI on; host localhost
Demo project demo-shop: no cloud service is contacted, but user Functions can still reach external providers; this CLI is not a network sandbox.
Working data and launch receipt are preserved in <project>/.firenook/runs/session-Syhid2. No automatic deletion.
Build: functions runs its build script before the emulators start
firenook: Starting emulators: auth, functions, firestore, pubsub, storage
firenook functions: Loaded functions definitions from source: helloWorld, orderTotal.
All emulators ready
✔ a document reads back as written (75.62125ms)
✔ a new order gets its total (179.281458ms)
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

Firenook's Linux engine needs glibc 2.28 or later. glibc is the C library of
most Linux distributions: RHEL 8 and its rebuilds, Debian 10, Ubuntu 20.04
and every later release have one new enough. Each release is started on
AlmaLinux 8, Debian 11, Ubuntu 22.04 and `node:24-slim` before it is
published.

Alpine Linux, and the `-alpine` Node images built on it, use musl instead.
On a musl system every command that needs the engine stops and says so:

```console
$ npx firenook emulators:exec "npm test"
Firenook: running the script through the shell as the official CLI does; use -- for an argv command without shell interpretation
Firenook: the Linux engine needs glibc 2.28 or newer, and this system has no glibc: its C library is musl, as on Alpine Linux. Use a glibc system or image instead, such as node:24 or node:24-slim rather than node:24-alpine
```

A system with an older glibc, such as Amazon Linux 2 (glibc 2.26), is
refused the same way, with the glibc it has. Installing glibc compatibility
packages on Alpine does not change this. For a job that runs in a container,
pick a glibc image with Node:

| Image | System | glibc | Runs Firenook |
| --- | --- | --- | --- |
| `node:24-slim`, `node:24` | Debian 12 | 2.36 | Yes |
| `node:24-trixie-slim`, `node:24-trixie` | Debian 13 | 2.41 | Yes |
| `node:24-alpine` | Alpine (musl) | none | No |

`node:24-slim` is the smallest that works, and the one Firenook's own checks
start the engine in. For Node 22 or 26, pick the same variant of `node:22`
or `node:26`.

## Other CI systems

Every CI system runs the same three steps: Node 22, 24 or 26, `npm ci` for
the project and its Functions, and `npx firenook emulators:exec`. What
differs is where the job runs and how it caches:

- **Jobs in a container** (GitLab CI, Bitbucket Pipelines, CircleCI's Docker
  executor and others): pick an image from the table above.
- **Caching:** keep npm's cache folder, keyed on your lockfiles, as
  `cache: npm` does on GitHub.
- **The log:** most systems set `CI`; where one does not, `emulators:exec`
  still prints plain lines.

In GitLab CI, for example:

```yaml title=".gitlab-ci.yml"
integration:
  image: node:24-slim
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
    - npx firenook emulators:exec --build "npm test"
```

## Several runs on one machine

A self-hosted runner that runs jobs side by side needs its own ports for each
job: give each its own copy of `firebase.json` with other ports. The jobs may
keep the same project id. The second suite to start with an id warns that
several run, and each still stops cleanly:

```text
firenook: It seems that you are running multiple instances of the emulator suite for project demo-shop. This may result in unexpected behavior. Firenook commands run in this project's folder still reach this suite (elsewhere, pass --hub-port 4400); the official CLI reaches the other one.
```

Commands such as `emulators:export` run in a job's own folder reach that
job's suite. Run elsewhere, they ask which one you mean; pass `--hub-port`
with that suite's hub port. GitHub-hosted runners give each job a machine of
its own, so none of this arises there.

## Next

Run the emulators in a container with [Docker](/docs/get-started/docker).
