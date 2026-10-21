// Runs the demo project on the published package and keeps what the home
// page shows of it: the orders in Firestore, the users in Auth, the files in
// Storage, the function calls, an agent's calls to `firenook mcp`, and a test
// run through `firenook emulators:exec`.
//
//   node capture.mjs ../../src/data/demo-run.json
//   node capture.mjs --hold   # keep the suite up for the console pictures
//
// The emulator starts in ../terminal/demo-shop and the shop opens: products
// and their pictures, customers, a dozen orders through the checkout
// function, and a webhook without a signature, which fails. The writes go
// through the MCP tools and the shop's own functions; every answer is kept
// as Firenook gave it. With --hold the suite stays up, with its data, until
// this process gets SIGTERM, so the console can be photographed.

import { spawn } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEMO = join(HERE, '..', 'terminal', 'demo-shop');
const FUNCTIONS = 'http://127.0.0.1:5001/demo-shop/us-central1/';
const hold = process.argv.includes('--hold');
const out = resolve(process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? join(HERE, '..', '..', 'src', 'data', 'demo-run.json'));

// The shop: what it sells, who buys, and what they order.
const products = [
  { sku: 'mug', name: 'Ember mug', price: 18, stock: 42, colour: '#f23818' },
  { sku: 'tote', name: 'Canvas tote', price: 24, stock: 18, colour: '#1c53cf' },
  { sku: 'pin', name: 'Flame pin', price: 4, stock: 260, colour: '#ff9800' },
  { sku: 'tee', name: 'Night tee', price: 28, stock: 35, colour: '#2f2f36' },
  { sku: 'cap', name: 'Field cap', price: 22, stock: 12, colour: '#4cc38a' },
  { sku: 'notebook', name: 'Grid notebook', price: 12, stock: 64, colour: '#a98bfa' },
  { sku: 'sticker', name: 'Sticker sheet', price: 3, stock: 500, colour: '#f472b6' },
  { sku: 'hoodie', name: 'Hearth hoodie', price: 54, stock: 9, colour: '#38bdf8' },
];
const customers = [
  { email: 'maya@example.com', displayName: 'Maya Chen', password: 'demo-shop-1' },
  { email: 'tom@example.com', displayName: 'Tom Okafor', password: 'demo-shop-2' },
  { phoneNumber: '+15555550123', displayName: 'Priya Nair' },
  { email: 'lucas@example.com', displayName: 'Lucas Moreau', password: 'demo-shop-3' },
  { email: 'amara@example.com', displayName: 'Amara Abara', password: 'demo-shop-4' },
  { email: 'kenji@example.com', displayName: 'Kenji Sato', password: 'demo-shop-5' },
  { email: 'sofia@example.com', displayName: 'Sofia Novak', password: 'demo-shop-6' },
  { phoneNumber: '+15555550188', displayName: 'Ravi Rahman' },
  { email: 'elif@example.com', displayName: 'Elif Demir', password: 'demo-shop-7' },
  { email: 'noah@example.com', displayName: 'Noah Fischer', password: 'demo-shop-8' },
  { email: 'ines@example.com', displayName: 'Ines Duarte', password: 'demo-shop-9' },
  { email: 'wei@example.com', displayName: 'Wei Zhang', password: 'demo-shop-10' },
];
const orders = [
  [['mug', 2]],
  [['tote', 1], ['pin', 2]],
  [['hoodie', 1]],
  [['tee', 2], ['sticker', 3]],
  [['notebook', 1], ['pin', 1]],
  [['cap', 1], ['mug', 1]],
  [['sticker', 5]],
  [['hoodie', 1], ['tee', 1]],
  [['tote', 2]],
  [['mug', 1], ['notebook', 2]],
  [['cap', 2]],
  [['pin', 4], ['sticker', 2]],
];
const price = Object.fromEntries(products.map((product) => [product.sku, product.price]));

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

function startEmulators() {
  const child = spawn('npx', ['firenook', 'emulators:start'], {
    cwd: DEMO,
    env: { ...process.env, FIRENOOK_PLAIN: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  const ready = new Promise((done, fail) => {
    const timer = setTimeout(() => fail(new Error(`not ready in 90 s:\n${log}`)), 90_000);
    const read = (chunk) => {
      log += chunk;
      if (/all emulators ready/i.test(log)) {
        clearTimeout(timer);
        done();
      }
    };
    child.stdout.setEncoding('utf8').on('data', read);
    child.stderr.setEncoding('utf8').on('data', read);
    child.on('exit', (code) => fail(new Error(`emulators exited (${code}):\n${log}`)));
  });
  return { child, ready };
}

async function post(name, body) {
  const response = await fetch(FUNCTIONS + name, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.status;
}

/** A small client for `firenook mcp` over stdio: one JSON-RPC message a line. */
function startMcp() {
  const child = spawn('npx', ['firenook', 'mcp'], { cwd: DEMO, stdio: ['pipe', 'pipe', 'inherit'] });
  const pending = new Map();
  let buffer = '';
  let next = 1;
  child.stdout.setEncoding('utf8').on('data', (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (!line) continue;
      const message = JSON.parse(line);
      const waiting = pending.get(message.id);
      if (!waiting) continue;
      pending.delete(message.id);
      if (message.error) waiting.fail(new Error(JSON.stringify(message.error)));
      else waiting.done(message.result);
    }
  });
  const send = (method, params, notify = false) => {
    const message = { jsonrpc: '2.0', method, params };
    if (notify) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
      return Promise.resolve();
    }
    const id = next++;
    child.stdin.write(`${JSON.stringify({ ...message, id })}\n`);
    return new Promise((done, fail) => pending.set(id, { done, fail }));
  };
  return { child, send };
}

const { child: emulators, ready } = startEmulators();
const calls = [];
let mcp;
let server;
try {
  await ready;
  await wait(1500);

  mcp = startMcp();
  const info = await mcp.send('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'firenook.dev capture', version: '1' },
  });
  await mcp.send('notifications/initialized', {}, true);

  const call = async (name, args = {}) => {
    const result = await mcp.send('tools/call', { name, arguments: args });
    const text = result.content?.find((part) => part.type === 'text')?.text ?? '';
    let value = text;
    try {
      value = JSON.parse(text);
    } catch {
      // Some tools answer in prose; keep it as it came.
    }
    calls.push({ tool: name, args, isError: Boolean(result.isError), result: value });
    return value;
  };

  // The catalogue and its pictures, then the customers.
  // A product's picture: its colour, its name and its price.
  const svg = (product) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${product.colour}"/>` +
    `<text x="200" y="196" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="46" font-weight="700" fill="#fff">${product.name}</text>` +
    `<text x="200" y="252" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#fff" fill-opacity="0.8">$${product.price}</text></svg>`;
  for (const product of products) {
    const { colour, ...fields } = product;
    await call('firestore_set', { path: `products/${product.sku}`, data: { ...fields, image: `products/${product.sku}.svg` } });
    await call('storage_upload', { path: `products/${product.sku}.svg`, text: svg(product), contentType: 'image/svg+xml' });
  }
  for (const customer of customers) await call('auth_create_user', customer);

  // Orders through the shop's own checkout function, then the webhook that
  // fails, last, so it is the newest call.
  for (const lines of orders) {
    await post('checkout', { items: lines.map(([sku, qty]) => ({ sku, price: price[sku], qty })) });
    await wait(250);
  }
  await wait(600);
  await post('stripeWebhook', { type: 'checkout.session.completed' });
  await wait(1500);

  await call('firestore_query', { collection: 'orders', orderBy: [{ field: 'total', direction: 'desc' }] });
  await call('auth_list_users');
  await call('storage_list', { prefix: 'products/' });
  await call('schedules_list');
  await call('functions_list_calls', { limit: 20 });
  const failed = await call('functions_list_calls', { outcome: 'failed' });
  const id = failed?.calls?.[0]?.id ?? failed?.items?.[0]?.id;
  if (id) await call('functions_get_call', { id });
  await call('rules_evaluate', { service: 'storage', method: 'create', path: 'products/mug.svg' });

  server = info.serverInfo;

  if (hold) {
    console.log('\nThe shop is open: http://127.0.0.1:4000/console. Send SIGTERM to this process to stop.');
    await new Promise((done) => process.once('SIGTERM', done));
  }
} finally {
  mcp?.child.stdin.end();
  mcp?.child.kill('SIGTERM');
  emulators.kill('SIGINT');
  await new Promise((done) => {
    const timer = setTimeout(() => {
      emulators.kill('SIGKILL');
      done();
    }, 20_000);
    emulators.on('exit', () => {
      clearTimeout(timer);
      done();
    });
  });
  rmSync(join(DEMO, '.firenook'), { recursive: true, force: true });
}

// The demo's test, the way CI runs it: start, test, stop, one command.
const command = 'node --test checkout.test.mjs';
const started = performance.now();
const exec = spawn('npx', ['firenook', 'emulators:exec', command], { cwd: DEMO, stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
exec.stdout.setEncoding('utf8').on('data', (chunk) => (output += chunk));
exec.stderr.setEncoding('utf8').on('data', (chunk) => (output += chunk));
const exitCode = await new Promise((done) => exec.on('exit', done));
const seconds = Number(((performance.now() - started) / 1000).toFixed(2));
rmSync(join(DEMO, '.firenook'), { recursive: true, force: true });

const version = JSON.parse(readFileSync(join(DEMO, 'node_modules', 'firenook', 'package.json'), 'utf8')).version;
const json = JSON.stringify(
  {
    version,
    server,
    capturedAt: new Date().toISOString(),
    calls,
    exec: { command, exitCode, seconds, lines: output.trimEnd().split('\n') },
  },
  null,
  2,
);
// Paths name files by where they are on this machine; the page shows them
// from the project's folder, as the terminal does.
writeFileSync(out, `${json.replaceAll(`${DEMO}/`, '').replaceAll(DEMO, '.')}\n`);
console.log(`kept ${calls.length} calls and a ${seconds} s test run in ${out}`);
