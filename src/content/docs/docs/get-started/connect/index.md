---
title: Connect your app
description: How apps and server code find the emulators, the ports and hosts to use, demo project ids, and the console's Connect dialog with ready snippets.
---

Firenook serves the same protocols on the same ports as the official
emulators, so an app connects to it exactly as it would to them. This page
covers what every platform has in common: how an SDK finds the emulators,
which host and port to give it, and which project id to use. The platform
pages after it have the code.

## How an app finds the emulators

There are two ways, and which one applies depends on where the code runs.

**Client SDKs** (web, Flutter, Android, Apple platforms, React Native) need
one call per product, made once, before the app reads or writes anything:

| Platform | The calls, for Authentication, Firestore, Storage and Functions |
| --- | --- |
| Web, React Native | `connectAuthEmulator`, `connectFirestoreEmulator`, `connectStorageEmulator`, `connectFunctionsEmulator` |
| Flutter | `useAuthEmulator`, `useFirestoreEmulator`, `useStorageEmulator`, `useFunctionsEmulator` |
| Android, Apple platforms | `useEmulator` on each product's instance |

**Server code** (the Admin SDKs and Google's Cloud client libraries) reads
environment variables instead. Set them before the SDK starts, or run the
code with `firenook emulators:exec`, which sets them for you:

| Variable | With the default ports | Read by |
| --- | --- | --- |
| `FIRESTORE_EMULATOR_HOST` | `127.0.0.1:8080` | Admin SDKs, Firestore libraries |
| `FIREBASE_AUTH_EMULATOR_HOST` | `127.0.0.1:9099` | Admin SDKs |
| `FIREBASE_STORAGE_EMULATOR_HOST` | `127.0.0.1:9199` | Admin SDKs for Node.js and Go |
| `STORAGE_EMULATOR_HOST` | `http://127.0.0.1:9199` | Cloud Storage libraries, and so the Python Admin SDK |
| `PUBSUB_EMULATOR_HOST` | `127.0.0.1:8085` | Pub/Sub libraries |
| `FIREBASE_EMULATOR_HUB` | `127.0.0.1:4400` | Tools that find the emulators |
| `GCLOUD_PROJECT` | The project id | Admin SDKs, Cloud libraries |
| `GOOGLE_CLOUD_PROJECT` | The project id | Admin SDKs, Cloud libraries |
| `GOOGLE_APPLICATION_CREDENTIALS` | A demo credentials file | SDKs that need credentials |
| `CLOUD_TASKS_EMULATOR_HOST` | `127.0.0.1:9499` | The Admin SDK's task queues |
| `CLOUD_EVENTARC_EMULATOR_HOST` | `http://127.0.0.1:9299` | The Admin SDK's Eventarc client |

`emulators:exec` sets the variables of the emulators that run, as the
official command does, the last two when Functions run, and writes the demo
credentials file. Write the hosts without `http://`, except the two that the
table shows with it. Your Functions need none of this: Firenook starts them
with the emulator hosts already set, the last two included.
[Server SDKs](/docs/get-started/connect/server) has the details per
language.

## Ports

Every emulator listens on the port `firebase.json` gives it under
`emulators`, or on the official default when it gives none. The ones an app
connects to:

| Emulator | Default port |
| --- | --- |
| Firestore | 8080 |
| Authentication | 9099 |
| Cloud Storage | 9199 |
| Cloud Functions | 5001 |
| Pub/Sub | 8085 |
| Eventarc | 9299 |
| Cloud Tasks | 9499 |
| Console (the Emulator UI port) | 4000 |

Every port, with the hub, logging and the Firestore WebSocket, is in
[Ports](/docs/reference/ports).

## Which host to use

Firenook listens on the loopback address unless you tell it otherwise, as the
official emulator does: Firestore, Auth, Storage and the other emulators on
`127.0.0.1`, and the hub and the console on `::1` as well. Use `127.0.0.1`
rather than `localhost`: a client that tries `::1` first without falling
back cannot reach Firestore, Auth or Storage.

| Where the app runs | Host to use |
| --- | --- |
| The same machine: a browser, Node.js, the iOS Simulator | `127.0.0.1` |
| The Android emulator | `10.0.2.2`, the emulator's name for your machine |
| A phone, tablet or another computer on your network | Your machine's network address, with Firenook started with `--host 0.0.0.0` |

To reach Firenook from another device, make it listen on every interface:

```sh
npx firenook emulators:start --host 0.0.0.0
```

It warns you before it starts:

```console
Firenook: binding 0.0.0.0; the emulators have no authentication, so every service, the data and arbitrary Functions execution are reachable from any device that can reach this host.
```

Take that literally, and only do it on a network you trust. `firebase.json`
can set the host instead, with `"host": "0.0.0.0"` on an emulator's entry.
Firenook listens on one host for every emulator, so the host you set on one
entry applies to all of them, and two different hosts are an error:

```console
Firenook: Unsupported host for auth: 0.0.0.0 differs from 192.168.1.50; the Firenook suite listens on one host (use --host or the same emulators.<name>.host everywhere).
```

When Firenook listens on `0.0.0.0`, the variables `emulators:exec` sets
still name `127.0.0.1`, since that is how code on the same machine reaches
it.

## Use the same project id

The app must use the project id Firenook runs with: the one in
`.firebaserc`, or the one you pass with `--project`. A `demo-` project id,
such as `demo-shop`, never reaches a real Firebase project, and the SDKs need
no real configuration for it:

- Any string works as the `apiKey`, but the client SDKs want one to be
  there.
- Cloud Storage's default bucket is `<project id>.appspot.com`, so a demo
  app sets `storageBucket: 'demo-shop.appspot.com'`.

With a real project id, keep your app's own configuration and add the
connect calls after it. Products you do not point at an emulator still talk
to Google.

If the ids differ, Firenook logs a warning ("Multiple projectIds are not
recommended in single project mode"), and the
console shows a banner that the app is using another project, with a
**How to fix** button. Data written without a signed-in user lands under the
other project id, where the console does not show it. Firestore requests
from a signed-in user fail with `UNAUTHENTICATED: emulator JWT claims do not
match this project`, because the Auth emulator issues tokens for Firenook's
own project.

## The console's Connect dialog

The console writes the connection code for you, with your ports, host and
project id filled in. Open the console (`http://127.0.0.1:4000/console`, or
press `o` in the terminal) and select **Connect** in the top bar. The dialog
lists the platforms down its side:

- **Apps**: Web, Flutter, Apple, Android
- **Servers**: Admin (Node), Python, Go, Java
- **Configuration**: Environment variables, and the `emulators` block of
  `firebase.json` with the ports this run uses
- **Agents**: the [MCP server](/docs/tools/mcp) for a coding agent

The **Host** menu at the top switches the snippets between this machine,
the address you opened the console at (when that is another machine's
address), `10.0.2.2` for the Android emulator, or a host you type. The
browser remembers your choice. A snippet leaves out a product that is not
running, so it never points at a port nothing listens on. For a `demo-`
project the snippet is complete and runs as printed; for a real project it
keeps your configuration and adds the connect lines.

The address names the platform, so a link opens the dialog on it:
`http://127.0.0.1:4000/console?connect=android`. The search box in the top
bar copies a snippet without opening the dialog: type `snippet` and pick
**Copy the Web snippet**, or another platform's.

## Platforms

- [Web](/docs/get-started/connect/web): the Firebase JS SDK in a browser
  app, with Vite and Next.js.
- [Flutter](/docs/get-started/connect/flutter): FlutterFire on Android, iOS
  and the web.
- [Android](/docs/get-started/connect/android): Kotlin and Java, the
  Android emulator and cleartext traffic.
- [Apple platforms](/docs/get-started/connect/apple): Swift and
  Objective-C, the Simulator and devices.
- [React Native](/docs/get-started/connect/react-native): React Native
  Firebase, or the JS SDK in Expo.
- [Server SDKs](/docs/get-started/connect/server): the Admin SDKs for
  Node.js, Python, Go and Java, and Google's Cloud client libraries.

## Next

Start with your app's platform above, then
[run your tests](/docs/get-started/tests) against the same emulators.
