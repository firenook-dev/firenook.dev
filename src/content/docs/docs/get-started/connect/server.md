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
then stops them and exits with the command's exit code. The command gets:

| Variable | Value with the default ports |
| --- | --- |
| `FIRESTORE_EMULATOR_HOST` | `127.0.0.1:8080` |
| `FIREBASE_AUTH_EMULATOR_HOST` | `127.0.0.1:9099` |
| `FIREBASE_STORAGE_EMULATOR_HOST` | `127.0.0.1:9199` |
| `STORAGE_EMULATOR_HOST` | `http://127.0.0.1:9199` |
| `PUBSUB_EMULATOR_HOST` | `127.0.0.1:8085` |
| `FIREBASE_EMULATOR_HUB` | `127.0.0.1:4400` |
| `GCLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT` | The project id |
| `GOOGLE_APPLICATION_CREDENTIALS` | A demo credentials file in the run's folder |
| `CLOUDSDK_CONFIG` | A path in the run's folder with no gcloud configuration |

The last two keep the SDKs away from your own Google login: an SDK that
looks for default credentials finds a demo file that grants nothing, and
finds no gcloud configuration. Each run's folder is under `.firenook/runs/`.

`emulators:exec` takes the official flags, such as `--only` and `--project`.
In 0.2.0-next.8 it sets the Authentication, Storage and Pub/Sub variables
even when `--only` leaves those emulators out, so they name ports that
nothing listens on. It does not set `CLOUD_TASKS_EMULATOR_HOST` or
`CLOUD_EVENTARC_EMULATOR_HOST`; your Functions get those from Firenook, and a
script that enqueues tasks or publishes events sets them itself (see
[Cloud Tasks and Eventarc](#cloud-tasks-and-eventarc)).

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
`FIREBASE_AUTH_EMULATOR_HOST`. Its Firestore client still looks for default
credentials, so give it a demo credentials file, as `emulators:exec` does:

```json title="demo-credentials.json"
{"type":"authorized_user","client_id":"demo","client_secret":"demo","refresh_token":"demo"}
```

```sh
export GOOGLE_APPLICATION_CREDENTIALS=demo-credentials.json
```

```python title="seed.py"
import firebase_admin
from firebase_admin import auth, firestore

firebase_admin.initialize_app(options={"projectId": "demo-shop"})

user = auth.create_user(email="ada@example.com", password="secret-pass")
firestore.client().document(f"users/{user.uid}").set({"name": "Ada"})
```

Cloud Storage works differently in Python. The SDK's `storage` module does
not read `FIREBASE_STORAGE_EMULATOR_HOST`; the Cloud Storage library under it
reads `STORAGE_EMULATOR_HOST`, with `http://`. It also uses the app's
credentials, and with the demo file it tries to refresh a token at Google and
fails with `RefreshError: ('invalid_client: The OAuth client was not found.'`.
Use the Cloud Storage client directly, with anonymous credentials:

```python
from google.auth.credentials import AnonymousCredentials
from google.cloud import storage

client = storage.Client(project="demo-shop", credentials=AnonymousCredentials())
blob = client.bucket("demo-shop.appspot.com").blob("reports/today.txt")
blob.upload_from_string("hello")
```

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
runs:

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
Firenook gives both to your Functions. Set them yourself for a script outside
Functions; `emulators:exec` does not. See [Cloud Tasks](/docs/services/tasks)
and [Eventarc](/docs/services/eventarc).

## Next

[Run your tests](/docs/get-started/tests) with `emulators:exec`, or run them
in [CI](/docs/get-started/ci).
