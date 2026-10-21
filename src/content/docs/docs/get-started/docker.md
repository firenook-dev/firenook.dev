---
title: Docker
description: Run Firenook in a container. Pick a glibc image with Node 24, listen on all interfaces, publish the ports, and keep the data in a volume.
---

Firenook runs in a Linux container as it runs on your machine. Four things
matter: an image with Node 24 and glibc 2.39 or later, the emulators listening
on all interfaces, the ports published, and a volume for the data you want to
keep.

## Pick the image

Firenook's Linux engine needs glibc 2.39 or later, so the image has to be at
least as new as Debian 13 or Ubuntu 24.04:

- `node:24-trixie-slim` (Debian 13, glibc 2.41) works.
- `node:24` and `node:24-slim` are Debian 12 (glibc 2.36), which is too old.
- `node:24-alpine` uses musl, not glibc, and Firenook has no engine for it.

[CI and GitHub Actions](/docs/get-started/ci#linux-needs-glibc) shows what
happens on a musl image.

## A Dockerfile

This one is for a project `firenook init` set up: Firenook in the root
`package.json` and a Functions codebase in `functions/`, each with its
lockfile.

```dockerfile title="Dockerfile"
# A glibc image with Node 24: Debian 13, not Alpine.
FROM node:24-trixie-slim

WORKDIR /app

# Firenook and its engine for this platform (linux-x64 or linux-arm64).
COPY package.json package-lock.json ./
RUN npm ci

# Your Functions' own dependencies.
COPY functions/package.json functions/package-lock.json functions/
RUN npm ci --prefix functions

COPY . .

# Every emulator on all interfaces, data kept in .firenook/state.
CMD ["npx", "firenook", "emulators:start", "--host", "0.0.0.0", "--keep-data"]
```

```text title=".dockerignore"
node_modules
functions/node_modules
.firenook
```

The lockfile lists the engine of every platform, so `npm ci` installs the
Linux engine in the image even when you wrote the lockfile on a Mac. Keep
`node_modules` out of the build context: the engine installed on your machine
is not the one the container needs.

## Listen on all interfaces

By default every emulator listens on `127.0.0.1`, which inside a container
only the container itself can reach. `--host 0.0.0.0` makes every emulator,
the hub and the console listen on all interfaces. Firenook warns you as it
starts, because the emulators have no authentication:

```text
Firenook: binding 0.0.0.0; the emulators have no authentication, so every service, the data and arbitrary Functions execution are reachable from any device that can reach this host.
```

Setting the same `host` on every entry under `emulators` in `firebase.json`
does the same, as with the official emulator. Firenook listens on one address
for the whole suite, so the `host` values must match.

The hub and the variables Firenook sets still give clients `127.0.0.1` as the
address, the one that reaches a port published to your machine. Bound to
`0.0.0.0`, the console answers whatever host name you reach it by.
`--allowed-hosts NAME,...` limits it to those names and the loopback ones.

## Publish the ports and keep the data

Publish each port under the same number, since clients use the ports that
`firebase.json` names. Mount a volume on `/app/.firenook` to keep the data
`--keep-data` saves in `.firenook/state`:

```yaml title="compose.yaml"
services:
  firebase:
    build: .
    ports:
      - "4000:4000" # console
      - "4400:4400" # hub
      - "4500:4500" # logging
      - "5001:5001" # Functions
      - "8080:8080" # Firestore
      - "8085:8085" # Pub/Sub
      - "9099:9099" # Auth
      - "9150:9150" # Firestore WebSocket
      - "9199:9199" # Storage
      - "9299:9299" # Eventarc
      - "9499:9499" # Cloud Tasks
    volumes:
      - firenook-data:/app/.firenook
    stop_grace_period: 1m

volumes:
  firenook-data:
```

```sh
docker compose up --build
```

Your app on your machine connects as usual, for example with
`connectFirestoreEmulator(db, '127.0.0.1', 8080)`, and the console is at
`http://127.0.0.1:4000/console`. Another container in the same Compose project
reaches the emulators by the service name, for example
`FIRESTORE_EMULATOR_HOST=firebase:8080`.

The volume holds each start's working files in `.firenook/runs/` too.
Firenook never deletes them; remove old runs when you no longer need them.

## Stop it cleanly

`docker compose stop` and `docker stop` send SIGTERM. Firenook passes it to
the engine, which closes the data and stops cleanly; with `--export-on-exit`,
it exports first. Docker waits 10 seconds by default before it kills the
container. A large data set can need longer to export, so the Compose file
above allows a minute (`docker stop -t 60` does the same). After a kill, the
next start checks the data and repairs it if it needs to.

## Run your tests in the image

`emulators:exec` works in the container as it does anywhere:

```sh
docker run --rm $(docker build -q .) npx firenook emulators:exec "npm test"
```

## Next

Run only the emulators you need with
[one service on its own](/docs/get-started/one-service).
