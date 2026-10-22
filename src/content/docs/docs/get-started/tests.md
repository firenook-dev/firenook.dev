---
title: Run your tests
description: Run integration tests against the emulators with firenook emulators:exec. The two command forms, the variables it sets, exit codes, seed data and an example.
---

`firenook emulators:exec` starts the emulators, waits until every one is
ready, runs your test command with the emulator variables set, then stops the
emulators and exits with your command's exit code. Use it for integration
tests on your machine and in [CI](/docs/get-started/ci).

```sh
npx firenook emulators:exec "npm test"
```

## The two command forms

Give the command as one quoted string, and Firenook runs it through the
system shell (`sh`, or `cmd.exe` on Windows), as the official
`emulators:exec` does. You can use `&&`, pipes and variables, and Firenook
says on stderr that a shell runs it:

```console
$ npx firenook emulators:exec "npm run build && npm test"
Firenook: running the script through the shell as the official CLI does; use -- for an argv command without shell interpretation
```

Or put the command after `--`, and Firenook starts the program directly, with
the arguments as they are and no shell in between:

```sh
npx firenook emulators:exec -- node --test test/orders.test.mjs
```

Two or more words without quotes and without `--` are refused, with the
command written the right way:

```console
$ npx firenook emulators:exec npm test
Firenook: emulators:exec received 2 arguments without --; run: firenook emulators:exec -- npm test
```

On Windows, start programs directly after `--` (`-- node test.mjs`). For a
`.cmd` script such as `npm`, use the quoted form or name its interpreter:
`-- cmd.exe /c npm test`.

`emulators:exec` takes the options of `emulators:start`: `--only`,
`--import`, `--export-on-exit`, `--project` and the rest. The console stays
off unless you pass `--ui` or `firebase.json` sets `emulators.ui.enabled` to
`true`, as `firenook init` does.

## Build TypeScript first

A TypeScript codebase runs from what the compiler wrote into `lib/`, which is
not committed. Add `--build`, and `emulators:exec` runs the codebase's own
`build` script before the emulators start:

```sh
npx firenook emulators:exec --build "npm test"
```

When the code does not compile, the tests do not run, and the run exits with
code 1. Trimmed:

```console
$ npx firenook emulators:exec --build "npm test"
Build: functions runs its build script before the emulators start
build functions: src/index.ts:16:9 TS2322: Type 'number' is not assignable to type 'string'.
build functions: build failed (exit code 2)
Firenook: the build in functions failed (npm run build); the tests did not run
```

A JavaScript codebase has no build script, and `--build` leaves it as it is.
[TypeScript](/docs/functions/typescript) covers `--build` with
`emulators:start` too.

## An example

In the project `firenook init` set up, a function adds up each new order. The
test writes an order with the Admin SDK and waits for the function to fill in
the total. It uses Node's built-in test runner, `node:test`. Add the function
to `functions/src/index.ts`:

```ts title="functions/src/index.ts"
import {onDocumentCreated} from "firebase-functions/firestore";

type Item = {sku: string; price: number; qty: number};

// Adds up a new order's items and writes the total back.
export const orderTotal = onDocumentCreated("orders/{orderId}", (event) => {
  const items: Item[] = event.data?.data().items ?? [];
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return event.data?.ref.update({total});
});
```

```js title="test/orders.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// emulators:exec sets GCLOUD_PROJECT and FIRESTORE_EMULATOR_HOST,
// so the Admin SDK talks to the emulator, never to a real project.
const db = getFirestore(initializeApp());

test('a document reads back as written', async () => {
  const ref = db.doc('products/mug');
  await ref.set({ name: 'Mug', price: 18 });
  const snapshot = await ref.get();
  assert.deepEqual(snapshot.data(), { name: 'Mug', price: 18 });
});

test('a new order gets its total', async () => {
  const ref = await db.collection('orders').add({
    items: [{ sku: 'mug', price: 18, qty: 2 }],
  });
  // The orderTotal function runs on the write; wait for its update.
  const total = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no total after 5 s')), 5000);
    const stop = ref.onSnapshot((snapshot) => {
      if (snapshot.get('total') === undefined) return;
      clearTimeout(timer);
      stop();
      resolve(snapshot.get('total'));
    });
  });
  assert.equal(total, 36);
});
```

Install the Admin SDK for the tests, and add two scripts:

```sh
npm install --save-dev firebase-admin
```

```json title="package.json"
{
  "scripts": {
    "test": "node --test",
    "test:integration": "firenook emulators:exec --build \"npm test\""
  }
}
```

`npm test` alone has no emulators to talk to; `npm run test:integration`
builds the functions and starts the emulators around it. Trimmed:

```console
$ npm run test:integration
Firenook: running the script through the shell as the official CLI does; use -- for an argv command without shell interpretation
Firenook 0.2.0; engine bbd437e754a4c14c5ab5d37e01843930f5a9bade; disk/WAL state ~/demo-shop/.firenook/runs/session-Syhid2/state
Services: firestore, auth, storage, functions, pubsub; Emulator UI on; host localhost
Build: functions runs its build script before the emulators start
firenook functions: Loaded functions definitions from source: helloWorld, orderTotal.
firenook functions[us-central1-orderTotal]: firestore function initialized.
All emulators ready
✔ a document reads back as written (75.62125ms)
firenook functions: Beginning execution of "us-central1-orderTotal"
✔ a new order gets its total (179.281458ms)
firenook functions: Finished "us-central1-orderTotal" in 178ms
ℹ tests 2
ℹ pass 2
ℹ fail 0
firenook functions host: stopping after the suite shutdown request
firenook suite stopped cleanly: {"functions":2,"schedules":0,"taskQueues":0,"firestoreDocuments":2,"authUsers":0,"storageObjects":0,"storageBytes":0, …}
```

### With Vitest

Vitest runs the same way. This suite clears Firestore before each test
through the emulator's own endpoint, so each test starts from an empty
database:

```js title="test/products.spec.mjs"
import { describe, it, expect, beforeEach } from 'vitest';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore(initializeApp());
const project = process.env.GCLOUD_PROJECT;
const firestore = process.env.FIRESTORE_EMULATOR_HOST;

beforeEach(async () => {
  await fetch(`http://${firestore}/emulator/v1/projects/${project}/databases/(default)/documents`, { method: 'DELETE' });
});

describe('products', () => {
  it('starts empty', async () => {
    expect((await db.collection('products').get()).size).toBe(0);
  });
  it('reads back what it wrote', async () => {
    await db.doc('products/mug').set({ name: 'Mug', price: 18 });
    expect((await db.doc('products/mug').get()).data()).toEqual({ name: 'Mug', price: 18 });
  });
});
```

```sh
npx firenook emulators:exec "npx vitest run"
```

Auth clears the same way, with `DELETE` on
`/emulator/v1/projects/<project>/accounts` on its port. From a shell,
`npx firenook firestore:delete --all-collections --force` clears Firestore on
the running emulators.

## The variables your command gets

Your command runs with your own environment plus the variables the official
`emulators:exec` sets, for the emulators that run and no others. With every
emulator running, on the default ports, for project `demo-shop`:

| Variable | Value | Set when |
| --- | --- | --- |
| `FIRESTORE_EMULATOR_HOST`, `FIREBASE_FIRESTORE_EMULATOR_ADDRESS` | `127.0.0.1:8080` | Firestore runs |
| `FIREBASE_AUTH_EMULATOR_HOST` | `127.0.0.1:9099` | Auth runs |
| `FIREBASE_STORAGE_EMULATOR_HOST` | `127.0.0.1:9199` | Storage runs |
| `STORAGE_EMULATOR_HOST` | `http://127.0.0.1:9199` | Storage runs |
| `PUBSUB_EMULATOR_HOST` | `127.0.0.1:8085` | Pub/Sub runs |
| `CLOUD_TASKS_EMULATOR_HOST` | `127.0.0.1:9499` | Functions run |
| `CLOUD_EVENTARC_EMULATOR_HOST` | `http://127.0.0.1:9299` | Functions run |
| `FIREBASE_EMULATOR_HUB` | `127.0.0.1:4400` | Always |
| `GCLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT` | `demo-shop` | Always |
| `FIREBASE_CONFIG` | The project id, its default bucket and database URL, as JSON | Unless you set it |
| `GOOGLE_APPLICATION_CREDENTIALS` | Demo credentials in the run's folder | Unless you set it |
| `CLOUDSDK_CONFIG` | A path in the run's folder, where gcloud finds no login of yours | Always |
| `NODE_OPTIONS` | Yours, plus a `--require` of Firenook's token helper | With the demo credentials |

The Admin SDKs and the Google Cloud client libraries read these, so they
connect to the emulators with no code change, and a service that does not
run gets no variable. The addresses are the ones clients connect to:
`127.0.0.1` even when the emulators listen on `0.0.0.0`.

The demo credentials are an `authorized_user` file, which every Admin SDK
reads, and they never send a token request to Google. The file holds the
emulators' own token for the Python SDK, and names the hub as the place to
refresh it, for Go and Java. A Node.js SDK sends its refresh to Google
whatever the file says, so the `NODE_OPTIONS` helper answers that one request
in each Node.js process of your command with the emulators' token. Only an
Eventarc publish from Node.js and Python's Storage calls ask for a token at
all.

When your environment already sets `GOOGLE_APPLICATION_CREDENTIALS`,
`emulators:exec` passes it on unchanged, as the official command does,
writes no demo credentials and says so:

```text
Firenook: keeping your GOOGLE_APPLICATION_CREDENTIALS (~/my-key.json), as the official exec does; a call that needs an access token gets it with those credentials
```

A call that needs a token then gets one from Google, with your credentials.

## Rules tests

Security Rules tests written with `@firebase/rules-unit-testing` run against
Firenook as they do against the official emulator: `initializeTestEnvironment`
loads your rules, `authenticatedContext()` and `unauthenticatedContext()` are
ruled as a signed-in and a signed-out client, and
`withSecurityRulesDisabled()` skips the rules. Run them inside
`emulators:exec` like any other test. [Security Rules](/docs/services/rules)
has the set-up and an example.

## Exit codes

| Code | When |
| --- | --- |
| Your command's code | The emulators started, your command ran, and the emulators stopped cleanly |
| `1` | The emulators could not start, your command could not be started, or the emulators exited before they were asked to stop |
| `130` | Your command was ended by Ctrl-C (SIGINT) |
| Another code from Firenook | The emulators failed while stopping, for example during an export |

A command that cannot be found ends the run with code 1:

```console
$ npx firenook emulators:exec -- no-such-command
Firenook: spawn no-such-command ENOENT
```

## Start from known data

`--import` loads an export before your command runs. Every run starts from it
again, and nothing is written back to it:

```sh
npx firenook emulators:exec --import ./seed "npm test"
```

One way to make the seed is to write the data and export it inside
`emulators:exec` itself:

```sh
npx firenook emulators:exec "node ./seed.mjs && npx firenook emulators:export ./seed"
```

Add `--export-on-exit ./after` to keep what the tests wrote, in the same
official format. [Seeds and imports](/docs/data/seeds) covers both.

## Working files

Each run keeps its working files in `.firenook/runs/session-*`: the launch
record, the data, and `firenook-debug.log` when you pass `--debug`. Firenook
never deletes them. Each one is small, but they add up: remove old runs when
you no longer need them.

## Next

Run the same command in [CI and GitHub Actions](/docs/get-started/ci).
