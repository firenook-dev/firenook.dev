// The demo's integration test: `firenook emulators:exec "node --test checkout.test.mjs"`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('checkout takes an order', async () => {
  const response = await fetch('http://127.0.0.1:5001/demo-shop/us-central1/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [{ sku: 'mug', price: 18, qty: 2 }] }),
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).total, 36);
});
