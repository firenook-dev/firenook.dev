---
title: Pub/Sub
description: Firenook's Pub/Sub emulator answers every RPC of the official one over gRPC and HTTP/JSON. Set it up, publish and pull, and see where it differs.
---

Firenook's Pub/Sub emulator answers every RPC of the official Pub/Sub
emulator, over gRPC and HTTP/JSON on one port. Read this page to set it up,
publish and receive messages, and see the few places where it behaves
differently.

## Set it up

Pub/Sub has no top-level section in `firebase.json`, so it starts when
`emulators.pubsub` is there:

```json title="firebase.json"
{
  "emulators": {
    "pubsub": { "port": 8085 }
  }
}
```

Google's Pub/Sub client libraries connect when `PUBSUB_EMULATOR_HOST` is set,
as they do to the official emulator:

```sh
PUBSUB_EMULATOR_HOST=127.0.0.1:8085 node publisher.mjs
```

Your Functions and `firenook emulators:exec` get the variable set for them.

## What it emulates

Every RPC of the official emulator's `google.pubsub.v1` Publisher, Subscriber
and SchemaService, and the `google.iam.v1` policy service, checked against a
recorded run of it:

- Topics, publishing and subscriptions with acknowledgement deadlines and
  redelivery.
- Pull, streaming pull and push delivery with retries.
- Ordering keys, filters, retention, seek and snapshots.
- Dead-letter topics and retry policies.
- Avro schemas with revisions, bound to topics.
- Delivery to your `onMessagePublished` functions, through a subscription
  named `emulator-sub-<topic>`, and the schedules of your `onSchedule`
  functions, in the time zone each declares.

It does not do what the official emulator answers with `501` either: Protocol
Buffer schemas, IAM, `detachSubscription` and `updateSnapshot`. It has no
BigQuery, Cloud Storage or Bigtable export subscriptions, and, like the
official emulator, it keeps no messages across a restart.

## Publish and receive

The client library works unchanged:

```js title="pubsub.mjs"
import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub({ projectId: 'demo-shop' });
const topic = pubsub.topic('orders');
const [subscription] = await topic.createSubscription('orders-email');
subscription.on('message', (m) => {
  console.log('received', m.data.toString(), m.attributes);
  m.ack();
});
const id = await topic.publishMessage({ json: { orderId: 'o43' }, attributes: { kind: 'paid' } });
console.log('published', id);
```

```console
$ PUBSUB_EMULATOR_HOST=127.0.0.1:8085 node pubsub.mjs
received {"orderId":"o43"} { kind: 'paid' }
published 2
```

The same port speaks HTTP/JSON, so `curl` works too. Here it pulls from
`orders-audit`, another subscription of the topic (output trimmed to one
message):

```console
$ curl -X POST -H 'Content-Type: application/json' --data '{"maxMessages":10}' \
    http://127.0.0.1:8085/v1/projects/demo-shop/subscriptions/orders-audit:pull
{
  "receivedMessages": [
    {
      "ackId": "projects/demo-shop/subscriptions/orders-audit:2",
      "message": {
        "data": "eyJvcmRlcklkIjoibzQyIn0=",
        "attributes": {
          "kind": "paid"
        },
        "messageId": "1",
        "publishTime": "2026-10-21T15:20:26.220070+00:00"
      }
    }
  ]
}
```

## Filters and dead letters

A subscription with a filter and a dead-letter policy behaves as in
production. Here it receives only `paid` messages, the handler refuses each
one, and after five attempts the message moves to the dead-letter topic with
the attributes Pub/Sub adds:

```js title="dead-letter.mjs"
const [events] = await pubsub.createTopic('events');
const [dead] = await pubsub.createTopic('events-dead');
const [paid] = await events.createSubscription('paid', {
  filter: 'attributes.kind = "paid"',
  deadLetterPolicy: { deadLetterTopic: dead.name, maxDeliveryAttempts: 5 },
});
await events.publishMessage({ data: Buffer.from('a'), attributes: { kind: 'paid' } });
await events.publishMessage({ data: Buffer.from('b'), attributes: { kind: 'refunded' } });
paid.on('message', (m) => {
  console.log('paid sub got', m.data.toString(), 'attempt', m.deliveryAttempt);
  m.nack();
});
```

```console
$ node dead-letter.mjs
paid sub got a attempt 1
paid sub got a attempt 2
paid sub got a attempt 3
paid sub got a attempt 4
paid sub got a attempt 5
dead-letter topic got a {
  CloudPubSubDeadLetterSourceDeliveryCount: '5',
  CloudPubSubDeadLetterSourceSubscription: 'paid',
  CloudPubSubDeadLetterSourceSubscriptionProject: 'demo-shop',
  CloudPubSubDeadLetterSourceTopicPublishTime: '2026-10-21T15:37:04.216Z',
  kind: 'paid'
}
```

## Where it differs

Three behaviours differ on purpose. Each follows production, or the official
emulator's design, where the recorded run of the official emulator says
nothing:

- **Acknowledged messages are dropped** once nothing can bring them back: the
  subscription does not retain acknowledged messages, no snapshot holds them,
  and no other subscription of the topic still needs them. Turning
  `retainAckedMessages` on later does not bring earlier acknowledgements back
  to a seek.
- **A topic's history is bounded**: the newest 5,000 messages and 16 MiB, or
  its retention window up to 100,000 messages and 256 MiB, and 512 MiB across
  all topics. Topic retention seeds a new subscription from that history.
- **Dead-lettered messages reach functions** listening on the dead-letter
  topic, as any publish does. No recorded run of the official emulator
  confirms this yet.

The console's Pub/Sub page can also peek at a backlog, force an
acknowledgement and run a schedule now. Those are console controls; no client
protocol reaches them.

## Use it on its own

For tests that need only Pub/Sub, run it without the rest of the suite:

```console
$ npx firenook native pubsub --project-id demo-shop --port 8085
Pub/Sub emulator ready at 127.0.0.1:8085 (project demo-shop)
```

[Run one service on its own](/docs/get-started/one-service) has the details.

## Next

- [Cloud Functions](/docs/services/functions): `onMessagePublished` triggers.
- [Scheduled functions](/docs/functions/scheduled): schedules run on Pub/Sub.
- [Cloud Tasks](/docs/services/tasks): queues for one-off work.
