---
title: Cloud Tasks
description: Queues for your onTaskDispatched functions with the official emulator's retries and rate limits, how to enqueue from a script, and what Firenook leaves out.
---

Firenook's Cloud Tasks emulator gives every `onTaskDispatched` function its
queue and dispatches tasks to it with the official emulator's retries and
rate limits. Read this page to enqueue tasks from your code and your scripts,
and to see how retries behave.

## Set it up

Cloud Tasks runs with Functions; there is nothing to add but its port, which
defaults to 9499:

```json title="firebase.json"
{
  "emulators": {
    "tasks": { "port": 9499 }
  }
}
```

Each `onTaskDispatched` export gets a queue when your functions load:

```text
firenook tasks: Created queue with key: queue:demo-shop-us-central1-sendReceipt
```

## Enqueue a task

A task queue function and an HTTP function that enqueues for it:

```js title="functions/index.js"
const { onRequest } = require('firebase-functions/https');
const { onTaskDispatched } = require('firebase-functions/tasks');
const logger = require('firebase-functions/logger');
const { getFunctions } = require('firebase-admin/functions');

exports.sendReceipt = onTaskDispatched(
  { retryConfig: { maxAttempts: 3, minBackoffSeconds: 1 }, rateLimits: { maxConcurrentDispatches: 2 } },
  async (request) => {
    logger.info('task', { data: request.data, retryCount: request.retryCount });
  },
);

exports.enqueueReceipt = onRequest(async (req, res) => {
  await getFunctions().taskQueue('sendReceipt').enqueue({ orderId: req.query.order });
  res.send('queued');
});
```

The Admin SDK finds the emulator through `CLOUD_TASKS_EMULATOR_HOST`.
Firenook sets it inside Functions, and `firenook emulators:exec` sets it for
its command, as the official `emulators:exec` does. A script that enqueues,
run under exec, and the function it reaches (trimmed to the task):

```js title="enqueue.mjs"
import { initializeApp } from 'firebase-admin/app';
import { getFunctions } from 'firebase-admin/functions';

initializeApp({ projectId: 'demo-shop' });
await getFunctions().taskQueue('sendReceipt').enqueue({ orderId: 'o50' }, { id: 'receipt-o50' });
console.log('enqueued receipt-o50');
```

```console
$ npx firenook emulators:exec "node enqueue.mjs && sleep 1"
All emulators ready
enqueued receipt-o50
firenook functions: Beginning execution of "us-central1-sendReceipt"
firenook functions: {"data":{"orderId":"o50"},"retryCount":0,"severity":"INFO","message":"task"}
```

The `sleep` keeps the emulators up until the task has run; a test waits for
what the task does instead. A script you run by hand sets
`CLOUD_TASKS_EMULATOR_HOST=127.0.0.1:9499` itself. `firenook functions:invoke
sendReceipt --event-data '{"orderId":"o8"}'` enqueues a task the same way,
through this emulator.

## Retries and rate limits

A task whose function fails, or answers anything but a 2xx status, is retried
with the backoff its `retryConfig` sets. The emulator reproduces the official
one's ladder, including its off-by-one: a queue with `maxAttempts: 3` runs a
failing task four times.

```text
firenook functions: {"retryCount":0,"executionCount":0,"severity":"INFO","message":"charge attempt"}
firenook functions: {"retryCount":1,"executionCount":0,"severity":"INFO","message":"charge attempt"}
firenook functions: {"retryCount":2,"executionCount":0,"severity":"INFO","message":"charge attempt"}
firenook functions: {"retryCount":3,"executionCount":0,"severity":"INFO","message":"charge attempt"}
```

`maxRetrySeconds` keeps a task retrying past `maxAttempts` until its time runs
out. `rateLimits` caps how many tasks run at once (`maxConcurrentDispatches`)
and how many start each second (`maxDispatchesPerSecond`), and a task
enqueued with `dispatchDeadlineSeconds` gets that long for each attempt.
Every dispatch carries the `X-CloudTasks-*` headers Cloud Tasks sends.

`GET /queueStats` on the Tasks port reports each queue:

```console
$ curl http://127.0.0.1:9499/queueStats
{"queue:demo-shop-us-central1-sendReceipt":{"numberOfTasks":0,"tasksAdded":0.2,"completedLastMin":1,"failedTasks":0,"runningTasks":2,"maxRate":500,"maxConcurrent":2}}
```

## The official emulator's quirks, kept

These come from the official emulator and are kept on purpose, because
clients and tests can see them:

- `runningTasks` is the number of dispatch slots, that is
  `maxConcurrentDispatches`, not the tasks running now.
- `tasksAdded` and `failedTasks` are five-minute counts divided by five;
  `completedLastMin` counts one minute.
- A `scheduleTime` never delays a task.
- A generated task name starts with a slash, while a delete builds the name
  without one, so a task with a generated name cannot be deleted. Name your
  tasks (`enqueue(data, { id })`) if you delete them.
- A 5xx answer leaves `executionCount` as it is; any other failure adds one.
- Registering a queue again, as a reload does, replaces it and drops its
  pending tasks.

## What it does not do

The same things the official emulator does not: no `scheduleTime` delay, no
OIDC tokens, no queue pause, resume, purge or task listing through an API,
none of the Cloud Tasks v2 API beyond creating and deleting tasks, and no
tasks kept across a restart. The console can pause, resume and purge queues,
run, stop and delete tasks, and hold a scheduled task until its time, but
those are console controls, not an API.

## Next

- [Cloud Functions](/docs/services/functions): the functions your tasks run.
- [Eventarc](/docs/services/eventarc): custom events between functions.
- [The console](/docs/tools/console): queues and tasks as they run.
