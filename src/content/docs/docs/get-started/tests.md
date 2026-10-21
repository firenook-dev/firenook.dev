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

## An example

In the project `firenook init` set up, a function adds up each new order. The
test writes an order with the Admin SDK and waits for the function to fill in
the total. It uses Node's built-in test runner, `node:test`. Add the function
to `functions/index.js`:

```js title="functions/index.js"
const {onDocumentCreated} = require("firebase-functions/firestore");

// Adds up a new order's items and writes the total back.
exports.orderTotal = onDocumentCreated("orders/{orderId}", (event) => {
  const items = event.data.data().items ?? [];
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return event.data.ref.update({total});
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
    "test:integration": "firenook emulators:exec \"npm test\""
  }
}
```

`npm test` alone has no emulators to talk to; `npm run test:integration`
starts them around it. Trimmed:

```console
$ npm run test:integration
Firenook: running the script through the shell as the official CLI does; use -- for an argv command without shell interpretation
Firenook 0.2.0-next.8; engine f7c3c663427fd181b0e67b31f960f6e5751b7d12; disk/WAL state ~/demo-shop/.firenook/runs/session-c5DodU/state
Services: firestore, auth, storage, functions, pubsub; Emulator UI on; host 127.0.0.1
firenook functions: Loaded functions definitions from source: helloWorld, orderTotal.
firenook functions[us-central1-orderTotal]: firestore function initialized.
All emulators ready

> demo-shop@1.0.0 test
> node --test

✔ a document reads back as written (53.903208ms)
firenook functions: Beginning execution of "us-central1-orderTotal"
✔ a new order gets its total (144.6505ms)
firenook functions: Finished "us-central1-orderTotal" in 144ms
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

Your command runs with your own environment plus these variables. The values
are for the default ports and project `demo-shop`:

| Variable | Value |
| --- | --- |
| `FIRESTORE_EMULATOR_HOST` | `127.0.0.1:8080` |
| `FIREBASE_AUTH_EMULATOR_HOST` | `127.0.0.1:9099` |
| `FIREBASE_STORAGE_EMULATOR_HOST` | `127.0.0.1:9199` |
| `STORAGE_EMULATOR_HOST` | `http://127.0.0.1:9199` |
| `PUBSUB_EMULATOR_HOST` | `127.0.0.1:8085` |
| `FIREBASE_EMULATOR_HUB` | `127.0.0.1:4400` |
| `GCLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT` | `demo-shop` |
| `GOOGLE_APPLICATION_CREDENTIALS` | A placeholder credentials file in the run's folder, never your own |
| `CLOUDSDK_CONFIG` | A gcloud configuration folder in the run's folder |

The Admin SDK and the Google Cloud client libraries read these, so they
connect to the emulators with no code change. The addresses are the ones
clients connect to: `127.0.0.1` even when the emulators listen on `0.0.0.0`.

Firenook sets the variables for every service, whether or not it is running.
It does not set `CLOUD_TASKS_EMULATOR_HOST` or `CLOUD_EVENTARC_EMULATOR_HOST`.
If your tests enqueue tasks through the Admin SDK, set the first one yourself:

```sh
npx firenook emulators:exec "CLOUD_TASKS_EMULATOR_HOST=127.0.0.1:9499 npm test"
```

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
