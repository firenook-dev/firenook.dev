---
title: Connect server code
description: Point the Admin SDKs for Node.js, Python, Go and Java, and Google's Cloud client libraries, at Firenook with environment variables or emulators:exec.
---

Server code finds the emulators through environment variables, which the
Admin SDKs and Google's Cloud client libraries read when they start. Run the
code with `firenook emulators:exec` and it sets them for you, or set them
yourself for a server you start on its own.

## Let emulators:exec set them

```sh
npx firenook emulators:exec -- node scripts/seed.js
npx firenook emulators:exec "npm test"
```

`emulators:exec` starts the emulators, runs the command once they are ready,
then stops them and exits with the command's exit code. The command gets the
variables the official `emulators:exec` sets, for the emulators that run and
no others:

| Variable | Value with the default ports | Set when |
| --- | --- | --- |
| `FIRESTORE_EMULATOR_HOST`, `FIREBASE_FIRESTORE_EMULATOR_ADDRESS` | `127.0.0.1:8080` | Firestore runs |
| `FIREBASE_AUTH_EMULATOR_HOST` | `127.0.0.1:9099` | Auth runs |
| `FIREBASE_STORAGE_EMULATOR_HOST` | `127.0.0.1:9199` | Storage runs |
| `STORAGE_EMULATOR_HOST` | `http://127.0.0.1:9199` | Storage runs |
| `PUBSUB_EMULATOR_HOST` | `127.0.0.1:8085` | Pub/Sub runs |
| `CLOUD_TASKS_EMULATOR_HOST` | `127.0.0.1:9499` | Functions run |
| `CLOUD_EVENTARC_EMULATOR_HOST` | `http://127.0.0.1:9299` | Functions run |
| `FIREBASE_EMULATOR_HUB` | `127.0.0.1:4400` | Always |
| `GCLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT` | The project id | Always |
| `GOOGLE_APPLICATION_CREDENTIALS` | Demo credentials in the run's folder | Unless you set it |
| `CLOUDSDK_CONFIG` | A path in the run's folder, where gcloud finds no login of yours | Always |

The demo credentials keep the SDKs away from your own Google login, and
none of them sends a token request to Google: the file holds the emulators'
own token, and names the hub as the place to refresh it. A Node.js SDK
refreshes at Google whatever the file says, so `emulators:exec` also adds a
`--require` of its token helper to `NODE_OPTIONS`, which answers that request
in each Node.js process of the command. Each run's folder is under
`.firenook/runs/`.

When your environment already sets `GOOGLE_APPLICATION_CREDENTIALS`,
`emulators:exec` keeps it, as the official command does, and writes no demo
credentials. [Run your tests](/docs/get-started/tests#the-variables-your-command-gets)
has the details.

## Set them yourself

For a server you run next to `firenook emulators:start`, such as a dev
server in another terminal, export the variables first:

```sh
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
export STORAGE_EMULATOR_HOST=http://127.0.0.1:9199
export PUBSUB_EMULATOR_HOST=127.0.0.1:8085
export GCLOUD_PROJECT=demo-shop
```

Or put them in the `.env` file your framework loads in development. Use the
ports from your `firebase.json` if they are not the defaults; the console's
**Connect** dialog prints these lines, under **Environment variables**, with
yours filled in. The project id must be the one Firenook runs with.

Never set them in production. With `FIREBASE_AUTH_EMULATOR_HOST` set, the
Admin SDKs accept unsigned ID tokens, which the Auth emulator issues.

## Node.js

The Admin SDK for Node.js reads `FIRESTORE_EMULATOR_HOST`,
`FIREBASE_AUTH_EMULATOR_HOST` and `FIREBASE_STORAGE_EMULATOR_HOST`, and needs
no credentials when they are set:

```js title="scripts/seed.js"
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

initializeApp({ projectId: 'demo-shop', storageBucket: 'demo-shop.appspot.com' })

const user = await getAuth().createUser({ email: 'ada@example.com', password: 'secret-pass' })
await getFirestore().doc(`users/${user.uid}`).set({ name: 'Ada' })
await getStorage().bucket().file('reports/today.txt').save('hello')
```

```sh
npx firenook emulators:exec -- node scripts/seed.js
```

`createCustomToken` works too: with the Auth emulator, the SDK signs nothing,
and the client SDK connected to the same emulator accepts the token.

## Python

The Admin SDK for Python reads `FIRESTORE_EMULATOR_HOST` and
`FIREBASE_AUTH_EMULATOR_HOST`. Its `storage` module does not read
`FIREBASE_STORAGE_EMULATOR_HOST`: the Cloud Storage library under it reads
`STORAGE_EMULATOR_HOST`, a URL with `http://`. The SDK also looks for default
credentials when it starts. Run it with `emulators:exec`, which sets all of
these:

```python title="seed.py"
import firebase_admin
from firebase_admin import auth, firestore, storage

firebase_admin.initialize_app(options={"projectId": "demo-shop", "storageBucket": "demo-shop.appspot.com"})

user = auth.create_user(email="ada@example.com", password="secret-pass")
firestore.client().document(f"users/{user.uid}").set({"name": "Ada"})
storage.bucket().blob("reports/today.txt").upload_from_string("hello")
```

```sh
npx firenook emulators:exec -- python seed.py
```

To run it on its own, next to `firenook emulators:start`, set the variables
and point `GOOGLE_APPLICATION_CREDENTIALS` at a demo credentials file like
the one `emulators:exec` writes. It holds the emulators' own token, which the
SDK uses as it is, so it never asks Google for one. With the default hub
port:

```json title="demo-credentials.json"
{"type":"authorized_user","client_id":"demo","client_secret":"demo","refresh_token":"demo","token_uri":"http://127.0.0.1:4400/firenook/oauth2/token","token":"owner","expiry":"2999-12-31T23:59:59Z"}
```

```sh
export GOOGLE_APPLICATION_CREDENTIALS=demo-credentials.json
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export STORAGE_EMULATOR_HOST=http://127.0.0.1:9199
python seed.py
```

The console's **Connect** dialog prints the Python lines with your ports and
this file's content filled in.

:::caution
Without `STORAGE_EMULATOR_HOST`, Python's Storage calls go to the real Cloud
Storage at `storage.googleapis.com`, with whatever credentials your machine
has. `FIREBASE_STORAGE_EMULATOR_HOST` alone does not stop that.
:::

## Go

The Admin SDK for Go reads `FIRESTORE_EMULATOR_HOST` and
`FIREBASE_AUTH_EMULATOR_HOST`, and copies `FIREBASE_STORAGE_EMULATOR_HOST`
into `STORAGE_EMULATOR_HOST` when that is not set. Run the program with
`emulators:exec`, or set the variables and the demo credentials file
yourself:

```go
app, err := firebase.NewApp(ctx, &firebase.Config{
	ProjectID:     "demo-shop",
	StorageBucket: "demo-shop.appspot.com",
})
```

```sh
npx firenook emulators:exec -- go run .
```

## Java

A Java program cannot change its own environment, so the variables, and
`GOOGLE_APPLICATION_CREDENTIALS` pointing at the demo credentials file, must
be set before the JVM starts. `emulators:exec` does that for the command it
runs. Java's Storage and Pub/Sub clients read no emulator variable, so build
them on the emulator; the console's Java snippet shows how.

```java
FirebaseOptions options = FirebaseOptions.builder()
    .setProjectId("demo-shop")
    .setStorageBucket("demo-shop.appspot.com")
    .setCredentials(GoogleCredentials.getApplicationDefault())
    .build();
FirebaseApp.initializeApp(options);
```

```sh
npx firenook emulators:exec -- ./gradlew run
```

## Google Cloud client libraries

Google's Cloud client libraries read the same variables: the Firestore
libraries `FIRESTORE_EMULATOR_HOST`, the Cloud Storage libraries
`STORAGE_EMULATOR_HOST`, and the Pub/Sub libraries `PUBSUB_EMULATOR_HOST`.
With Pub/Sub, for example, no code changes:

```js title="scripts/publish.js"
import { PubSub } from '@google-cloud/pubsub'

const pubsub = new PubSub({ projectId: 'demo-shop' })
const [topic] = await pubsub.createTopic('orders')
const [subscription] = await topic.createSubscription('orders-worker')
await topic.publishMessage({ json: { orderId: 'A-1001' } })
subscription.once('message', async (message) => {
  console.log(message.data.toString())
  message.ack()
  await subscription.close()
  await pubsub.close()
})
```

```sh
PUBSUB_EMULATOR_HOST=127.0.0.1:8085 node scripts/publish.js
```

With `PUBSUB_EMULATOR_HOST` set, the library needs no credentials.

## Cloud Tasks and Eventarc

The Admin SDK sends task queue calls to `CLOUD_TASKS_EMULATOR_HOST`
(`127.0.0.1:9499`, no scheme) and Eventarc events to
`CLOUD_EVENTARC_EMULATOR_HOST` (`http://127.0.0.1:9299`, with the scheme).
Firenook gives both to your Functions, and `emulators:exec` sets both for its
command when Functions run. A script you run on its own sets them itself.

The Node.js SDK reaches both, and Python's reaches Cloud Tasks. An Eventarc
publish from Node.js asks for an access token first: under `emulators:exec`
it gets the emulators' own; run on its own, it asks your default
credentials. See [Cloud Tasks](/docs/services/tasks) and
[Eventarc](/docs/services/eventarc).

## Next

[Run your tests](/docs/get-started/tests) with `emulators:exec`, or run them
in [CI](/docs/get-started/ci).
