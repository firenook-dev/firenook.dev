---
title: Connect a web app
description: Point the Firebase JS SDK at Firenook with one connect call per product, once, and only in development, with patterns for Vite and Next.js.
---

A web app built on the Firebase JS SDK (the modular API, `firebase` on npm)
reaches Firenook through four functions, one per product. You call them once,
right after you create each service and before anything reads or writes. The
same code works in Node.js, for scripts and tests that use the client SDK.

## Connect

Keep Firebase's set-up in one module and import the services from it
everywhere else. For a `demo-` project, this is all the configuration the app
needs:

```js title="src/firebase.js"
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'

export const app = initializeApp({
  projectId: 'demo-shop',
  apiKey: 'demo-api-key',
  storageBucket: 'demo-shop.appspot.com',
})
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

connectAuthEmulator(auth, 'http://127.0.0.1:9099')
connectFirestoreEmulator(db, '127.0.0.1', 8080)
connectStorageEmulator(storage, '127.0.0.1', 9199)
connectFunctionsEmulator(functions, '127.0.0.1', 5001)
```

The project id must be the one Firenook runs with. The Auth emulator accepts
any `apiKey`, but the SDK wants one, and Cloud Storage needs the default
bucket, which is `<project id>.appspot.com`. With a real project, pass your
app's own configuration to `initializeApp` and keep the four connect lines.

Use the ports from your `firebase.json` if they are not the defaults. The
console's **Connect** dialog prints this code with your ports and project id
filled in; see [Connect your app](/docs/get-started/connect#the-consoles-connect-dialog).

## Only in development

Wrap the connect calls in a check, so a production build talks to your real
project. With Vite, `import.meta.env.DEV` is true under `vite` and false in
`vite build`:

```js title="src/firebase.js"
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099')
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
}
```

To switch the emulators on and off by hand instead, use a variable. Vite
gives client code only the variables that start with `VITE_`, and Next.js only
those that start with `NEXT_PUBLIC_`, which it writes into the bundle when it
builds:

```sh title=".env.development.local"
# Vite
VITE_USE_EMULATORS=true
# Next.js
NEXT_PUBLIC_USE_EMULATORS=true
```

Then test it where the example above tests `import.meta.env.DEV`:
`import.meta.env.VITE_USE_EMULATORS === 'true'` with Vite, or
`process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'` with Next.js.

In Next.js, the client SDK belongs in client components. Route handlers,
server actions and server components use the Admin SDK, which finds the
emulators through environment variables; see
[Server SDKs](/docs/get-started/connect/server).

## What each call expects

- **`connectAuthEmulator(auth, url)`** takes a URL with its scheme,
  `http://127.0.0.1:9099`. It shows a banner at the bottom of the page,
  "Running in emulator mode. Do not use with production credentials." Pass
  `{ disableWarnings: true }` as the third argument to hide it.
- **`connectFirestoreEmulator(db, host, port)`** takes the host and the port
  apart, with no scheme.
- **`connectStorageEmulator(storage, host, port)`** does too. Download URLs
  then point at the emulator, for example
  `http://127.0.0.1:9199/v0/b/demo-shop.appspot.com/o/users%2F…?alt=media&token=…`.
- **`connectFunctionsEmulator(functions, host, port)`** connects the
  `functions` instance you pass. If your functions run in another region,
  connect the instance for that region:
  `getFunctions(app, 'europe-west1')`. An HTTP function is at
  `http://127.0.0.1:5001/demo-shop/us-central1/helloWorld`, project, region
  and name in the path.

Calling `connectFirestoreEmulator` or `connectAuthEmulator` a second time
with the same arguments, as a hot reload that runs the module again does, is
harmless. Calling `connectAuthEmulator` with a different URL after the app has
used Auth throws `auth/emulator-config-failed`.

## Open the app from another device

On a phone, `127.0.0.1` is the phone. To try the app on another device, let
both the dev server and Firenook listen on your network, and take the host
from the address the page was opened at:

```sh
npx firenook emulators:start --host 0.0.0.0
npx vite --host
```

```js title="src/firebase.js"
const host = location.hostname === 'localhost' ? '127.0.0.1' : location.hostname

connectAuthEmulator(auth, `http://${host}:9099`)
connectFirestoreEmulator(db, host, 8080)
connectStorageEmulator(storage, host, 9199)
connectFunctionsEmulator(functions, host, 5001)
```

Firenook has no authentication: with `--host 0.0.0.0`, anyone on the network
can read and change the data. Do it only on a network you trust.

## Check the connection

Sign a user up and write a document, then open the console at
`http://127.0.0.1:4000/console`. The user is under Authentication and the
document under Firestore. If the console shows a banner that your app is
using another project, the project id in `initializeApp` is not the one
Firenook runs with.

## Next

Connect your [server code](/docs/get-started/connect/server), or
[run your tests](/docs/get-started/tests) against the emulators.
