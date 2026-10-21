---
title: Eventarc
description: Publish custom events and deliver them to your onCustomEventPublished functions with Firenook's Eventarc emulator, from Functions or from a script.
---

Firenook's Eventarc emulator takes the custom events your code publishes and
delivers each one to the `onCustomEventPublished` functions that listen for
its type. Read this page to publish an event from a function or a script and
to see what it keeps.

## Set it up

Eventarc runs with Functions; there is nothing to add but its port, which
defaults to 9299:

```json title="firebase.json"
{
  "emulators": {
    "eventarc": { "port": 9299 }
  }
}
```

## Listen for an event

A handler names the event type, and optionally a channel and filters on the
event's attributes:

```js title="functions/index.js"
const { onCustomEventPublished } = require('firebase-functions/eventarc');
const logger = require('firebase-functions/logger');

exports.onShipped = onCustomEventPublished('shop.order.shipped', (event) => {
  logger.info('eventarc', { type: event.type, data: event.data });
});
```

When your functions load, the handler is registered with the emulator:

```text
firenook functions[us-central1-onShipped]: eventarc function initialized.
```

## Publish an event

Publish with the Admin SDK's Eventarc client. The default channel is the
`firebase` channel of your project:

```js title="publish.mjs"
import { initializeApp } from 'firebase-admin/app';
import { getEventarc } from 'firebase-admin/eventarc';

initializeApp({ projectId: 'demo-shop' });
await getEventarc().channel().publish({
  type: 'shop.order.shipped',
  source: '/shop/orders',
  subject: 'orders/o42',
  data: { orderId: 'o42', carrier: 'post' },
});
console.log('published');
```

Inside Functions, Firenook sets `CLOUD_EVENTARC_EMULATOR_HOST` for you. A
script outside Functions sets it, as a URL:

```console
$ CLOUD_EVENTARC_EMULATOR_HOST=http://127.0.0.1:9299 node publish.mjs
published
```

and the handler runs:

```text
firenook functions: {"type":"shop.order.shipped","data":{"carrier":"post","orderId":"o42"},"severity":"INFO","message":"eventarc"}
```

Without the variable, the Admin SDK sends the event to the real Eventarc
service, with whatever Google credentials your machine has. Set it in every
script that publishes, and in tests: `firenook emulators:exec` does not set it
for its command in 0.2.0-next.8, where the official `emulators:exec` does.

The Admin SDK also needs a `source`. In production the Functions runtime
supplies one; in a plain function, outside an Extension, pass it yourself or
the SDK refuses with `CloudEvent 'source' is required.`, as it does on the
official emulator.

## What it emulates

- Trigger registration and the `getTriggers` and `publishEvents` routes, on
  the native `google` channel and on named channels.
- Delivery by event type, channel and filters to every matching handler.
- Events published by Extensions, on their channels.
- A record of every event, with what each subscription did with it, including
  events that could not be read and events nothing listens for: the last
  1,000, at most 16 MiB. The console's Eventarc page shows them and can
  publish or replay one.

To see what is registered, ask the emulator:

```console
$ curl http://127.0.0.1:9299/google/getTriggers
{"shop.order.shipped-projects/demo-shop/locations/us-central1/channels/firebase":[{"eventTrigger":{"channel":"projects/demo-shop/locations/us-central1/channels/firebase","eventFilters":{},"eventType":"shop.order.shipped"},"projectId":"demo-shop","triggerName":"us-central1-onShipped-0-projects/demo-shop/locations/us-central1/channels/firebase"}]}
```

`firenook functions:invoke onShipped --event-data '{"orderId":"o7"}'` delivers
an event straight to one handler; `--event-type` overrides the type.

It does not deliver Firebase Alerts on the native channel, so a function that
listens for an alert never runs.

## Next

- [Cloud Functions](/docs/services/functions): the handlers events reach.
- [Extensions](/docs/services/extensions): Extensions that publish events.
- [Connect your coding agent](/docs/tools/mcp): list, publish and replay
  events from your agent.
