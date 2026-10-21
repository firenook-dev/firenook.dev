---
title: Connect a Flutter app
description: Point FlutterFire at Firenook with useAuthEmulator, useFirestoreEmulator, useStorageEmulator and useFunctionsEmulator on Android, iOS and the web.
---

Each FlutterFire plugin has a method that points it at an emulator. Call
them in `main()`, after `Firebase.initializeApp` and before the app uses
Firebase. The same code serves Android, iOS and the web.

## Connect

```dart title="lib/main.dart"
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  if (kDebugMode) {
    const host = '127.0.0.1';
    await FirebaseAuth.instance.useAuthEmulator(host, 9099);
    FirebaseFirestore.instance.useFirestoreEmulator(host, 8080);
    await FirebaseStorage.instance.useStorageEmulator(host, 9199);
    FirebaseFunctions.instance.useFunctionsEmulator(host, 5001);
  }

  runApp(const MyApp());
}
```

`useAuthEmulator` and `useStorageEmulator` return a `Future`; await them.
`kDebugMode` keeps the calls out of release builds. Use the ports from your
`firebase.json` if they are not the defaults; the console's **Connect**
dialog prints this code with them filled in.

If your functions run in another region, connect that region's instance:
`FirebaseFunctions.instanceFor(region: 'europe-west1')`.

## A demo project without FlutterFire's configuration

A `demo-` project needs no `firebase_options.dart`. Initialize with options
like these, the ones the console's Flutter snippet prints:

```dart
await Firebase.initializeApp(
  options: const FirebaseOptions(
    apiKey: 'demo-api-key',
    appId: '1:000000000000:ios:0000000000000000',
    messagingSenderId: '0',
    projectId: 'demo-shop',
    storageBucket: 'demo-shop.appspot.com',
  ),
);
```

The project id must be the one Firenook runs with, and the storage bucket is
`<project id>.appspot.com`. The app id only has to have the shape the
platform SDKs check for. With a real project, keep
`DefaultFirebaseOptions.currentPlatform`.

## The host on each platform

| Where the app runs | Host |
| --- | --- |
| iOS Simulator, macOS, the web | `127.0.0.1` |
| Android emulator | `127.0.0.1` works: FlutterFire changes it to `10.0.2.2` |
| A phone or tablet | Your machine's network address, with Firenook started with `--host 0.0.0.0` |

On Android, each of the four methods replaces `127.0.0.1` and `localhost`
with `10.0.2.2`, the Android emulator's name for your machine. They take
`automaticHostMapping: false` to turn that off. A network address is left as
it is, so on a real device pass your machine's address. One way is to give it
at launch:

```sh
npx firenook emulators:start --host 0.0.0.0
flutter run --dart-define=EMULATOR_HOST=192.168.1.20
```

```dart
const host = String.fromEnvironment('EMULATOR_HOST', defaultValue: '127.0.0.1');
```

With `--host 0.0.0.0`, anyone on your network can reach the emulators and the
data, so use it only on a network you trust.

On Windows, `useStorageEmulator` prints a message and returns without
connecting: FlutterFire does not support the Storage emulator there.

## Android: allow cleartext traffic

The emulators speak plain HTTP, and Android blocks cleartext traffic by
default for apps that target Android 9 (API level 28) or later. Allow it to
the emulator's host in a network security config that only debug builds use:

```xml title="android/app/src/debug/res/xml/network_security_config.xml"
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

```xml title="android/app/src/debug/AndroidManifest.xml" ins={3}
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <application android:networkSecurityConfig="@xml/network_security_config" />
</manifest>
```

Add a `<domain>` line for your machine's address when you use a real device.
[Android](/docs/get-started/connect/android#allow-cleartext-traffic) explains
the file.

## iOS: allow local network connections

Authentication, Storage and Functions requests are plain HTTP, which App
Transport Security governs. Add `NSAllowsLocalNetworking` to
`ios/Runner/Info.plist`, and on a real device a reason for the Local Network
prompt. [Apple platforms](/docs/get-started/connect/apple#app-transport-security)
has both keys.

## The offline cache

Firestore keeps an offline cache on the device, and the SDK does not clear it
when the emulator's data changes. Without `--keep-data`, every Firenook start
is empty, so the cache can still hold documents from the last run. Google
suggests turning persistence off while you use the emulator. Set it before
`useFirestoreEmulator`:

```dart
FirebaseFirestore.instance.settings = const Settings(persistenceEnabled: false);
FirebaseFirestore.instance.useFirestoreEmulator(host, 8080);
```

## Next

The same set-up for native apps: [Android](/docs/get-started/connect/android)
and [Apple platforms](/docs/get-started/connect/apple).
