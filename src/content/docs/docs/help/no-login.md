---
title: Without a Google login
description: Run Firenook with no firebase login and no Google credentials. What a demo- project id does, what Firenook contacts, and how to make Extensions work offline.
---

Firenook needs no `firebase login`, no Google account and no credentials to
run your project. The one exception is an Extension from the registry, which
needs a login once. This page explains what stays on your machine, what
Firenook contacts, and how to run without any login at all.

## Use a demo- project id

A project id that starts with `demo-`, such as `demo-shop`, belongs to no real
Firebase project, so nothing that uses it can reach one. `firenook init`
writes a `demo-<folder>` id into `.firebaserc` for that reason. At start,
Firenook says what that means:

```text
Demo project demo-proj: no cloud service is contacted, but user Functions can still reach external providers; this CLI is not a network sandbox.
```

Pass one for a single run with `--project`:

```sh
npx firenook emulators:start --project demo-shop
```

Firenook accepts a real project id too, and still never contacts Firebase
itself. It says so at start:

```text
Firenook: real project id shop-local-1234; every Functions worker is started with the emulator hosts and without Google credentials, but this CLI is not a network sandbox.
```

With a real id, your code can still reach the real project if it builds its
own client with explicit credentials. A `demo-` id rules that out, so prefer
one for local work and tests.

## What your functions get

Firenook starts your functions with the emulators' addresses set, so the
Admin SDK talks to the emulators without any change to your code:

| Variable | What it holds |
| --- | --- |
| `FIRESTORE_EMULATOR_HOST` | Firestore's address, `127.0.0.1:8080` with the default ports |
| `FIREBASE_AUTH_EMULATOR_HOST` | Authentication's address |
| `FIREBASE_STORAGE_EMULATOR_HOST` | Cloud Storage's address |
| `PUBSUB_EMULATOR_HOST` | Pub/Sub's address |
| `GCLOUD_PROJECT` | The project id |
| `FUNCTIONS_EMULATOR` | `true` |

Your own Google credentials are kept away from them.
`GOOGLE_APPLICATION_CREDENTIALS` is not passed on, a `FIREBASE_TOKEN` in your
shell never reaches a function, and `CLOUDSDK_CONFIG` points at the run's own
folder, which holds placeholder credentials. A function that asks the Google
auth library for application default credentials gets those placeholders,
even on a machine where `gcloud auth application-default login` has stored
real ones. A call that needs an access token, such as an Eventarc publish or
a task enqueue, gets the emulators' own token, answered inside the function's
process, so the request never leaves your machine.

## What Firenook contacts

The emulators, the console and the terminal work offline. The console loads
nothing from the internet and sends nothing anywhere. Firenook sends no
telemetry. Three things can still use the network:

- **The release check.** In a terminal, the npm package asks the npm registry
  for `firenook`'s version tags at most once a day, in the background, and
  shows a newer release on the next start. It is off in CI, in the plain
  output, and with `FIRENOOK_NO_UPDATE_CHECK=1` or `NO_UPDATE_NOTIFIER=1`.
- **An Extension from the registry**, on its first start only (see below).
- **Your own code.** Firenook is not a network sandbox. A function that
  calls a payment provider, an email service or any other API reaches it, as
  it would with the official emulator.

Secret Manager is never contacted. Give a function's secrets in
`functions/.secret.local`, and an Extension's in
`extensions/<instance>.secret.local`.

## Extensions without a login

An Extension that `firebase.json` takes from the registry, such as
`firebase/firestore-send-email@0.1.34`, is downloaded on its first start. That
download uses the Firebase CLI's stored login or a `FIREBASE_TOKEN`, the same
credential the official emulator uses. Without either, the start stops with
`HTTP Error: 401`.

Do it once, on one machine with a login, and keep the result in the project:

```sh
npx firenook ext:vendor
```

`ext:vendor` copies each Extension's source into `extensions/.sources` with
the registry details it needs. Commit that folder. Every later start, on
every machine and in CI, loads the Extension from the project with no login
and no network.

To make sure nothing reaches the registry, start with `--offline` (or set
`FIRENOOK_OFFLINE=1`). Any Extension that would still need the registry then
stops the start with a message that names it. `npx firenook doctor` lists
every Extension and whether it starts offline.

An Extension whose source is a local folder never needs the registry.

## Functions that call external services

Firenook runs your functions as they are, so calls to outside services
happen. To keep a local run self-contained:

- Use test or sandbox keys for those services, never production ones.
- Put local settings in `functions/.env.local`, which Firenook loads after
  `.env` and `.env.<projectId>`, as the official emulator does. Point a
  service's address at a local stand-in there.
- Check `process.env.FUNCTIONS_EMULATOR === 'true'` in code that must never
  run for real on your machine.

## Next

[Extensions](/docs/services/extensions) covers parameters, secrets and
vendoring in full. On Windows, see also
[Windows](/docs/help/windows#extensions-and-the-firebase-login).
