---
title: Extensions
description: Run the Extensions in your firebase.json with Firenook from local, vendored, cached or registry sources, and make them start offline with ext:vendor.
---

Firenook runs the Extensions instances listed in your `firebase.json` as
extra Functions backends, with the official emulator's rules for their
parameters, specs and triggers. Read this page to see where their code comes
from, how to make them start with no network and no login, and what is not
supported.

## Where an instance's code comes from

Instances are listed as the official CLI lists them:

```json title="firebase.json"
{
  "extensions": {
    "search": "algolia/firestore-algolia-search@1.2.10",
    "thumbnails": "./extensions-src/thumbnails"
  }
}
```

`extensions` counts as Functions, so the Functions port serves them and
`--only functions` includes them. Firenook looks for each instance's code in
this order:

| Source | Where | Needs network |
| --- | --- | --- |
| Local | The path you wrote, read from disk | No |
| Vendored | `extensions/.sources/<publisher>/<name>@<version>` in your project | No |
| Cached | The firebase-tools cache, `~/.cache/firebase/extensions` (or `FIREBASE_EXTENSIONS_CACHE_PATH`) | No |
| Registry | Downloaded once, then built with `npm install` and `npm run gcp-build` | Yes, and a login |

Parameters come from `extensions/<instance>.env`, `.env.<alias>`,
`.env.<projectId>`, `.env.local` and `.secret.local`, with the official
precedence, defaults and `${param:X}` substitution. While the suite runs, a
change to an instance's parameter files reloads that instance; a change that
does not load is logged with its error.

## Start offline with ext:vendor

`firenook ext:vendor` copies each resolved source into the project and
records how unpinned references resolved, so every later start reads it from
there:

```console
$ npx firenook ext:vendor
search: vendored algolia/firestore-algolia-search@1.2.10 at ./extensions/.sources/algolia/firestore-algolia-search@1.2.10
```

Commit `extensions/.sources/` and your teammates and CI start the same
Extensions with no network and no Firebase login. `firenook doctor` shows, for
every instance, where its source comes from and whether it starts offline:

```json
{
  "instanceId": "search",
  "written": "algolia/firestore-algolia-search@1.2.10",
  "kind": "registry",
  "version": "1.2.10",
  "source": "vendored",
  "offlineReady": true,
  "paramsFound": true,
  "note": null
}
```

An instance with no vendored or cached source reads `"offlineReady": false`
and the note `no vendored or cached source; the first start downloads it
(network and a Firebase CLI login or FIREBASE_TOKEN)`.

`firenook ext:vendor --offline` never contacts the registry: it copies only
what the shared cache already holds, with its `firenook-registry.json`, and
names what it could not copy:

```console
$ npx firenook ext:vendor --offline
firenook extensions: counter (firebase/firestore-counter@0.2.10) could not be vendored: firebase/firestore-counter@0.2.10 is not vendored under ~/demo-shop/extensions/.sources/firebase/firestore-counter@0.2.10 and not in the cache at ~/.cache/firebase/extensions/firebase/firestore-counter@0.2.10; run `firenook ext:vendor` with network access
```

To make sure nothing is fetched, start with `--offline` (or set
`FIRENOOK_OFFLINE=1`). An instance that would need the registry then stops the
start and says what to do:

```text
suite failed: Extensions failed to load: firebase/storage-resize-images@0.2.10 is not vendored under ./extensions/.sources/firebase/storage-resize-images@0.2.10 and not in the cache at ~/.cache/firebase/extensions/firebase/storage-resize-images@0.2.10; run `firenook ext:vendor` with network access
```

## What needs a login

Only the registry. To read an Extension's metadata and, the first time, its
source archive, Firenook uses the Firebase CLI's stored login or a
`FIREBASE_TOKEN` refresh token, the same credential the official emulator
uses. It reads the login where the Firebase CLI writes it:
`$XDG_CONFIG_HOME/configstore/firebase-tools.json`, else
`~/.config/configstore/firebase-tools.json`, with `~` your home folder
(`%USERPROFILE%` on Windows). It then keeps the registry's answers next to
the source (`firenook-registry.json`), so later starts stay offline. A source
vendored or cached under Firenook's former name keeps its old file and still
starts offline. Local, vendored and
cached instances need no login at all; [Without a Google
login](/docs/help/no-login) covers working that way.

Secret Manager is never contacted. Put secret parameters in
`extensions/<instance>.secret.local`.

## What it does not run

- **Lifecycle tasks** (`onInstall`, `onUpdate`, `onConfigure`): an Extension's
  task-queue functions are not delivered, as on the official emulator.
- **Triggers for a service the suite does not emulate or does not start.**
  The whole instance is left out, with the official emulator's lines. Here
  `--only functions` leaves out Firestore:

  ```text
  firenook extensions[audit]:  ignored becuase it includes firestore triggered functions, and the firestore emulator does not exist or is not running.
  firenook extensions: No Cloud Functions for these instances will be emulated, because partially emulating an Extension can lead to unexpected behavior.
  ```
- **Dynamic Extensions** defined in your Functions code, and Extensions
  written in Python or Dart.
- **Secret Manager**, as above.

## Next

- [Cloud Functions](/docs/services/functions): the runtime Extensions share.
- [Eventarc](/docs/services/eventarc): events an Extension publishes.
- [CI and GitHub Actions](/docs/get-started/ci): vendored Extensions in CI.
