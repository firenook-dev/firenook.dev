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
further one. `--inspect-functions=9230` starts from the port you give. See [Debugging](/docs/functions/debugging).

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

Every listener binds `127.0.0.1` unless you choose another address with
`--host` or `emulators.<name>.host`. Firenook listens on one host for all
of them: an `emulators.<name>.host` that differs from the others is an
error, unless it is a loopback address.

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
  ├─ ✕ Firenook could not start ───────────────────────────────────────────────────────┤
  │                                                                                    │
  │  Problem       port 31499 for Auth is held by firenook (PID 30426): another        │
  │                Firenook                                                            │
  │                                                                                    │
  │  Fix           stop it:  kill 30426                                                │
  │                or give Auth a free port in firebase.json:                          │
  │                "emulators": { "auth": { "port": 31500 } }                          │
  │                                                                                    │
  │  Data          nothing of yours was changed                                        │
  │                                                                                    │
  ╰────────────────────────────────────────────────────────────────────────────────────╯
```

The suggested port is a free one at the time. In plain output:

```text
suite failed: cannot bind auth at 127.0.0.1:31499: Address already in use (os error 48)
```

Either way the command exits with code 1. Firenook never stops the other
program for you.

## Run two suites at once

Give each suite its own ports in its own `firebase.json`, every listener
included, and its own project id. The temporary-folder file is named after
the project id, so two suites with the same id share it: the second start
takes it over, and when the first one stops it ends with this error and
exit code 1:

```text
suite failed: failed to remove Hub locator: locator ownership changed while Firenook was running
```

## Next

[Configuration](/docs/reference/configuration) covers the rest of
`firebase.json`, and [Run one service on its own](/docs/get-started/one-service)
starts a subset of the emulators.
