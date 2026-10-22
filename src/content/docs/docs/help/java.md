---
title: The Java 21 error
description: Why the Firebase CLI's emulators stop with "no longer supports Java version before 21", how to fix it with Java, and how Firenook runs with no Java at all.
---

This page is for you if `firebase emulators:start` stopped with an error
about Java. It explains why the official emulators need Java 21, how to fix
that, and how Firenook avoids Java altogether.

## The error

With Java 17 on the `PATH`, the current Firebase CLI (firebase-tools 15.34.0)
stops before any emulator starts:

```console
$ firebase emulators:start --project demo-shop
i  emulators: Shutting down emulators.

Error: firebase-tools no longer supports Java version before 21. Please install a JDK at version 21 or above to get a compatible runtime.
```

With no Java at all, it stops with this instead:

```console
$ firebase emulators:start --project demo-shop
i  emulators: Shutting down emulators.

Error: Could not spawn `java -version`. Please make sure Java is installed and on your system PATH.
```

## Why it happens

The official Cloud Firestore, Realtime Database and Cloud Storage emulators
are Java programs: `.jar` files the Firebase CLI downloads on first use (the
Firestore emulator alone is about 137 MB in firebase-tools 15.34.0). Before it
starts any of them, the CLI runs `java -version` and stops when the major
version is below 21.

The minimum moved with the CLI's releases. Version 14.19.0 deprecated Java
versions below 21, and [version 15.0.0](https://firebase.google.com/support/release-notes/cli)
removed support for them. So the error usually appears right after an
upgrade to firebase-tools 15, on a machine or CI image that still has an
older Java.

## Fix it with Java

Install a JDK at version 21 or later, then make sure the shell that runs the
emulators finds it:

```sh
java -version
```

The first line must name version 21 or later. If it names an older one,
another Java comes first on your `PATH`, or `JAVA_HOME` points at it. The
same applies to CI images and dev containers: each needs its own Java 21.

## Or run Firenook, which needs no Java

Firenook's emulators are native code in one npm package, and Node runs your
Functions, as in production. It never runs `java`: it starts the whole suite
with no Java on the `PATH`, and its own CI checks a start with `java` absent.
It needs Node 22, 24 or 26, and nothing else is downloaded at install or
start.

Switching keeps your `firebase.json`, rules, Functions code and data. Install
it next to firebase-tools, which you keep for deploying:

```sh
npm install --save-dev --save-exact firenook
```

Then change one word in the command you run:

```diff lang="json"
 "scripts": {
-  "emulators": "firebase emulators:start --import ./data"
+  "emulators": "firenook emulators:start --import ./data"
 }
```

Firenook reads the official export format, so `--import` takes the data the
official emulator wrote, and your app connects on the same ports.

## Next

[Switch from the Firebase emulators](/docs/get-started/switch) covers the
whole move, including keeping data between runs.
