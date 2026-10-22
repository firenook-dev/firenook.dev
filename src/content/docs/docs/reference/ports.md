---
title: Ports
description: Every port Firenook listens on, its default, the firebase.json key and flag that change it, the host, and what happens when a port is taken.
---

Firenook listens on the same ports as the official emulators, so your app
and tools need no change. This page lists every listener, how to move it,
and what Firenook does when a port is already in use.

## Every listener

| Listener | Default | `firebase.json` key | Flag | Runs when |
| --- | --- | --- | --- | --- |
| Firestore | 8080 | `emulators.firestore.port` | | Firestore runs |
| Firestore requests WebSocket | 9150 | `emulators.firestore.websocketPort` | `--firestore-websocket-port` | Firestore runs |
| Authentication | 9099 | `emulators.auth.port` | | Auth runs |
| Cloud Storage | 9199 | `emulators.storage.port` | | Storage runs |
| Cloud Functions | 5001 | `emulators.functions.port` | | Functions runs |
| Eventarc | 9299 | `emulators.eventarc.port` | `--eventarc-port` | Functions runs |
| Cloud Tasks | 9499 | `emulators.tasks.port` | `--tasks-port` | Functions runs |
| Pub/Sub | 8085 | `emulators.pubsub.port` | | Pub/Sub runs |
| Hub | 4400 | `emulators.hub.port` | `--hub-port` | Always |
| Console (the Emulator UI port) | 4000 | `emulators.ui.port` | | The UI is on |
| Logging | 4500 | `emulators.logging.port` | `--logging-port` | The UI is on |

A flag wins over `firebase.json`, and `firebase.json` over the default. The
emulators with no flag in the table take their port from `firebase.json`
only. Each listener serves what its official counterpart serves: gRPC and
REST on the same Firestore and Pub/Sub ports, the console and `/api/config`
on the UI port, and the hub's `/emulators` listing and export routes on the
hub port. The Firestore WebSocket carries the Firestore requests feed for
tools that read it, and the logging listener carries the log stream the old
Emulator UI read.

Functions workers started with `--inspect-functions` also open the Node
inspector, on 9229 for the first codebase and the next port for each
further one. `--inspect-functions=9230` starts from the port you give. An
Extension instance is a codebase too, and when one is configured it takes
the first port, so your own code gets the next one. See
[Debugging](/docs/functions/debugging).

A typical `firebase.json` with every port named:

```json title="firebase.json"
{
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080, "websocketPort": 9150 },
    "pubsub": { "port": 8085 },
    "storage": { "port": 9199 },
    "eventarc": { "port": 9299 },
    "tasks": { "port": 9499 },
    "hub": { "port": 4400 },
    "logging": { "port": 4500 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

The ports must all be different, including the defaults of emulators you
do not start. A clash stops Firenook before anything listens:

```console
$ npx firenook emulators:start --hub-port 9099
Firenook: Emulator ports must be distinct
```

## Host

The default host is `localhost`, bound as the official CLI binds it:

- Firestore, its WebSocket, Auth, Storage, Functions, Eventarc, Cloud
  Tasks, Pub/Sub and the logging listener listen on `127.0.0.1`.
- The hub and the console listen on `127.0.0.1` and on `::1`, so
  `http://localhost:4000/console` opens whichever address your browser
  tries first.

An emulator's own port therefore refuses `http://[::1]:8080`, as it does
with the official CLI, and every address Firenook gives your app, your
tests and the Connect dialog is `127.0.0.1`. A port that is free on
`127.0.0.1` but taken on `::1` is a warning, not an error.

`--host` or `emulators.<name>.host` chooses another address, and an
address you name is that address alone: `--host ::1` puts every listener on
the IPv6 loopback. Firenook listens on one host for all of them: an
`emulators.<name>.host` that differs from the others is an error, unless it
is a loopback address.

With `--host 0.0.0.0` (or `::`) the emulators listen on every network
interface, and the addresses Firenook gives your app, your tests and the
Connect dialog use `127.0.0.1` (or `::1`). Any other host than loopback
prints a warning, because the emulators have no authentication:

```text
Firenook: binding 0.0.0.0; the emulators have no authentication, so every service, the data and arbitrary Functions execution are reachable from any device that can reach this host.
```

The console has its own check on the host names it answers for; see
[The console](/docs/tools/console#reach-it-by-another-name).

## Find the ports in use

- The terminal's ready summary lists them, with the console's address.
- `/api/config` on the UI port answers with every emulator's host and port,
  as the official Emulator UI's does.
- The hub's `/emulators` route answers the same listing.
- The console's Connect dialog prints the `emulators` block of
  `firebase.json` for the ports in use.
- The MCP tool `firenook_status` returns them to a coding agent.

A running suite also records its hub's address in `hub-<project>.json` in
the system's temporary folder, as the official emulators do.
`emulators:export`, `firestore:delete`, `functions:invoke` and
`firenook mcp` find the suite through that file, so they work even when the
ports differ from `firebase.json`.

## When a port is taken

When a port is in use, Firenook stops, says which program holds it, and
leaves your data as it was. In a terminal:

```text
  ├─ ✕ Firenook could not start ─────────────────────────────────────────────────────┤
  │                                                                                  │
  │  Problem       port 38212 for Auth is held by firenook (PID 94724): another      │
  │                Firenook                                                          │
  │                                                                                  │
  │  Fix           stop it:  kill 94724                                              │
  │                or give Auth a free port in firebase.json:                        │
  │                "emulators": { "auth": { "port": 38218 } }                        │
  │                                                                                  │
  │  Data          nothing of yours was changed                                      │
  │                                                                                  │
  ╰──────────────────────────────────────────────────────────────────────────────────╯
```

The suggested port is a free one at the time. In plain output:

```text
suite failed: cannot bind auth at 127.0.0.1:38212: Address already in use (os error 48)
```

Either way the command exits with code 1. Firenook never stops the other
program for you.

## Run two suites at once

Give each suite its own ports in its own `firebase.json`, every listener
included. The two may share a project id, such as two checkouts of one
project. The second one to start warns, as the official CLI does, and both
run and stop cleanly:

```text
firenook: It seems that you are running multiple instances of the emulator suite for project demo-shop. This may result in unexpected behavior. Firenook commands run in this project's folder still reach this suite (elsewhere, pass --hub-port 4415); the official CLI reaches the other one.
```

The `hub-<project>.json` file names one suite per project id, the first one
started, and the official CLI's commands reach that one. Firenook's
commands (`emulators:export`, `firestore:delete`, `functions:invoke`,
`firenook mcp`) reach the suite started from the folder they run in, or a
folder inside it. Run from another folder, they need `--hub-port` to choose
one, and without it they name both suites and exit 1:

```console
$ npx firenook firestore:delete orders -r -f --json --project demo-shop
Firenook: 2 suites run for demo-shop (http://127.0.0.1:4400 from ~/demo-shop, http://127.0.0.1:4415 from ~/demo-shop-copy); run the command in the project's folder, or pass --hub-port <port> to choose one
$ npx firenook firestore:delete orders -r -f --json --project demo-shop --hub-port 4415
{"path":"orders","mode":"recursive","deleted":2}
```

:::caution
Auth sends its user events to the Functions port in `firebase.json`
(`127.0.0.1:5001` by default) even when Functions does not run, as with
`--only firestore,auth`. If another suite's Functions emulator listens on
that port, it receives them. When two suites run at once, give each its own
`emulators.functions.port`, or run Functions with Auth.
:::

## Next

[Configuration](/docs/reference/configuration) covers the rest of
`firebase.json`, and [Run one service on its own](/docs/get-started/one-service)
starts a subset of the emulators.
