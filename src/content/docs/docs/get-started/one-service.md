---
title: Run one service on its own
description: Start only the emulators you need with --only, learn which services lean on others, and run Pub/Sub, Auth or Firestore alone with no project and no Java.
---

You rarely need every emulator at once. A test of your Firestore rules needs
Firestore; a worker that pulls from Pub/Sub needs Pub/Sub. This page shows two
ways to start less: `--only` in a project, and `firenook native` with no
project at all.

## Choose services with `--only`

`--only` takes the official emulator names, separated by commas:

```sh
npx firenook emulators:start --only firestore
npx firenook emulators:start --only firestore,functions
npx firenook emulators:exec --only pubsub "npm test"
```

| Name | Starts |
| --- | --- |
| `firestore` | Firestore, with its WebSocket port |
| `auth` | Authentication |
| `storage` | Cloud Storage |
| `functions` | Cloud Functions, with Eventarc and Cloud Tasks |
| `pubsub` | Pub/Sub |
| `extensions` | The same as `functions` |

The hub, the logging port and the console start with any of them, unless
`firebase.json` turns the console off. `eventarc`, `tasks`, `hub`, `ui` and
`logging` follow the services above and start nothing by themselves.
`database`, `hosting`, `dataconnect` and `apphosting` are refused, since
Firenook does not emulate them.

A service also has to be configured in `firebase.json`. One that is not gets
a warning and does not start:

```console
$ npx firenook emulators:exec --only firestore,pubsub -- npm test
Firenook: not starting the pubsub emulator; firebase.json does not configure it (run firenook init --adopt or add emulators.pubsub).
```

When nothing is left to start, Firenook stops with
`No emulators to start, run firenook init to get started.`

## What each service needs from the others

Each service starts and answers on its own. Some features reach into another
service, and work only when that one runs too:

| Service | Needs another service for |
| --- | --- |
| Firestore | Nothing. Functions triggered by its writes need `functions`. |
| Auth | Nothing. Blocking functions and user triggers need `functions`. |
| Storage | Rules that call `firestore.get()` or `firestore.exists()` read the local Firestore. Without `firestore` they find no document. |
| Functions | HTTP and callable functions run alone. Firestore, Storage and Auth triggers need their service; Pub/Sub triggers and scheduled functions need `pubsub`. |
| Pub/Sub | Nothing. Functions that handle its messages need `functions`. |

Firenook does not warn about a trigger whose service is not running. It loads
the function, and the function never runs:

```console
$ npx firenook emulators:start --only functions --plain
firenook functions: Loaded functions definitions from source: helloWorld, orderTotal, nightly, onOrderEvent.
firenook functions[us-central1-orderTotal]: firestore function initialized.
firenook functions[us-central1-nightly]: pubsub function initialized.
firenook functions[us-central1-onOrderEvent]: pubsub function initialized.
All emulators ready
```

Here `orderTotal` waits for Firestore writes, `nightly` for its schedule and
`onOrderEvent` for Pub/Sub messages, and none of them comes: list `firestore`
and `pubsub` in `--only` as well.

## Keeping data with fewer services

`--keep-data` keeps Firestore, Auth and Storage together, so it needs all
three in the list:

```console
$ npx firenook emulators:start --only firestore --keep-data
suite failed: --resume-state requires the firestore, auth and storage services (the native state receipt covers all three)
```

Start `--only firestore,auth,storage --keep-data` and add the others you need.
For one service alone, use `--import` and `--export-on-exit`; see
[export and snapshots](/docs/data/export).

## Pub/Sub alone, without Java

The official Pub/Sub emulator comes with the Google Cloud CLI and needs a Java
runtime. `firenook native pubsub` serves the same Pub/Sub that runs inside
Firenook's suite, on one port, with no `firebase.json`, no project and no
Java. It speaks gRPC and HTTP/JSON, so the Google Cloud client libraries
connect to it through `PUBSUB_EMULATOR_HOST`.

```console
$ npx firenook native pubsub --project-id demo-shop --port 8085
Pub/Sub emulator ready at 127.0.0.1:8085 (project demo-shop)
```

In another terminal, a publisher and a subscriber with the Node.js client:

```js title="publisher.mjs"
import { PubSub } from '@google-cloud/pubsub';

// PUBSUB_EMULATOR_HOST points the client at the emulator.
const pubsub = new PubSub({ projectId: 'demo-shop' });
const [topic] = await pubsub.createTopic('orders');
const [subscription] = await topic.createSubscription('orders-worker');

subscription.on('message', (message) => {
  console.log(`received ${message.data} (${message.attributes.kind})`);
  message.ack();
  subscription.close().then(() => process.exit(0));
});

const id = await topic.publishMessage({ data: Buffer.from('order 1001'), attributes: { kind: 'created' } });
console.log(`published ${id}`);
```

```console
$ PUBSUB_EMULATOR_HOST=127.0.0.1:8085 node publisher.mjs
published 1
received order 1001 (created)
```

| Option | Default | Does |
| --- | --- | --- |
| `--port` | `8085` | The port for gRPC and HTTP/JSON |
| `--host` | `127.0.0.1` | The address to listen on |
| `--project-id` | `demo-firenook` | The project the emulator reports itself under; requests may name any project |

Topics, subscriptions and messages live in memory and are gone when it stops.
Ctrl-C stops it. `firenook native` runs on any Node from 20 up, and you can
run it without installing Firenook first:
`npx firenook@0.2.0-next.8 native pubsub --port 8085`. The
[Pub/Sub service page](/docs/services/pubsub) covers what it supports.

## Auth alone

`firenook native auth` serves Firenook's Auth emulator by itself, with every
operation the suite's Auth has. Accounts live in memory, or in a JSON file
with `--state-file`, which keeps accounts, codes and configuration between
runs:

```console
$ npx firenook native auth --project-id demo-shop --port 9099 --state-file ./auth.json
Auth emulator ready at http://127.0.0.1:9099 (project demo-shop)
```

Clients connect with `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`, or
`connectAuthEmulator(auth, 'http://127.0.0.1:9099')` in the web SDK.
`--functions-origin http://127.0.0.1:5001` sends user creation and deletion
events to a Functions emulator running elsewhere.

## Firestore alone

`firenook native firestore` serves Firestore by itself. Its options follow
the official Firestore emulator's, such as `--project_id`, `--rules` and
`--seed_from_export`, and `--data-dir` keeps the data on disk;
`npx firenook native firestore --help` lists them all.

```console
$ npx firenook native firestore --project_id demo-shop --port 8080
WARNING: firenook Security Rules are not configured; client access is open
firenook Firestore listening on 127.0.0.1:8080 with 4 runtime worker thread(s); mimalloc purge delay 100 ms, decommit true
```

The Admin SDK connects with `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`.

:::caution
`firenook native` starts the engine directly. It skips the checks
`emulators:start` makes for you, such as reading `firebase.json` and keeping
the project, the data and your credentials apart. Prefer
`emulators:start --only` inside a project.
:::

## Next

See what each emulator covers in the [services](/docs/services/firestore)
pages, starting with Firestore.
