---
title: Connect a React Native app
description: Point React Native Firebase or the Firebase JS SDK at Firenook, choose the host for simulators and devices, and pick the SDK that suits Expo.
---

React Native apps reach Firebase through one of two SDKs, and both connect to
Firenook the way they connect to the official emulators. This page shows
each, and the host to use on simulators, emulators and devices.

## Which SDK to use

- **React Native Firebase** (`@react-native-firebase/*`) wraps the native
  Android and Apple SDKs, so it also has the products the JS SDK lacks on
  mobile, such as Analytics and Crashlytics. It needs native code: in an Expo
  project, that means a development build, not Expo Go.
- **The Firebase JS SDK** (`firebase`) is plain JavaScript. It runs in Expo
  Go and covers Authentication, Firestore, Storage and Functions, the four
  products a client SDK connects to an emulator.

If the app already uses one, keep it: the emulators work the same with
both.

## React Native Firebase

React Native Firebase's modular API has the same connect functions as the
web SDK. Call them once, early, before the app uses Firebase:

```js title="src/firebase.js"
import { connectAuthEmulator, getAuth } from '@react-native-firebase/auth'
import { connectFirestoreEmulator, getFirestore } from '@react-native-firebase/firestore'
import { connectStorageEmulator, getStorage } from '@react-native-firebase/storage'
import { connectFunctionsEmulator, getFunctions } from '@react-native-firebase/functions'

if (__DEV__) {
  connectAuthEmulator(getAuth(), 'http://127.0.0.1:9099')
  connectFirestoreEmulator(getFirestore(), '127.0.0.1', 8080)
  connectStorageEmulator(getStorage(), '127.0.0.1', 9199)
  connectFunctionsEmulator(getFunctions(), '127.0.0.1', 5001)
}
```

React Native Firebase takes the project from your native configuration
files, `google-services.json` and `GoogleService-Info.plist`. Firenook must
run with that project's id: put it in `.firebaserc` or pass it with
`--project`. Firenook accepts any project id, and starts your Functions
without Google credentials.

On Android, each of these functions replaces `127.0.0.1` and `localhost`
with `10.0.2.2`, the Android emulator's name for your machine, and logs a
line saying so. The same code therefore works on the iOS Simulator and the
Android emulator. To turn the replacement off, set React Native Firebase's
flag in the `firebase.json` at your project's root:

```json title="firebase.json"
{
  "react-native": {
    "android_bypass_emulator_url_remap": true
  }
}
```

When the app and the emulators share that `firebase.json`, Firenook accepts
the `react-native` key and ignores it.

## The Firebase JS SDK, as in Expo Go

The JS SDK does not change the host for you, so choose it by platform:

```js title="src/firebase.js"
import { Platform } from 'react-native'
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

if (__DEV__) {
  const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1'
  connectAuthEmulator(auth, `http://${host}:9099`)
  connectFirestoreEmulator(db, host, 8080)
  connectStorageEmulator(storage, host, 9199)
  connectFunctionsEmulator(functions, host, 5001)
}
```

This is the [web set-up](/docs/get-started/connect/web) with a
platform-dependent host. For a `demo-` project these options are all the
configuration it needs; with a real project, pass your app's own.

## On a phone or tablet

On a real device, `127.0.0.1` is the device itself, and `10.0.2.2` leads
nowhere. Use your machine's network address, and start Firenook so it listens
on your network:

```sh
npx firenook emulators:start --host 0.0.0.0
```

React Native Firebase leaves a network address as it is, on Android too.
Firenook has no authentication: with `--host 0.0.0.0`, anyone on the network
can reach the emulators and the data, so use it only on a network you trust.

## Plain HTTP on Android and iOS

The emulators speak plain HTTP. Apps made from the React Native template
already allow it in development: the React Native Gradle plugin allows
cleartext traffic in debug builds and blocks it in release builds, and the
template's `Info.plist` sets `NSAllowsLocalNetworking`. If your app changed
those settings, see [Android](/docs/get-started/connect/android#allow-cleartext-traffic)
and [Apple platforms](/docs/get-started/connect/apple#app-transport-security).

## Next

Connect the [server code](/docs/get-started/connect/server) your app talks
to, or [run your tests](/docs/get-started/tests) against the emulators.
