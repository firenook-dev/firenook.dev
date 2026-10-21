// Runs the demo project on the published package and keeps what the home
// page shows of it: the orders in Firestore, the users in Auth, the files in
// Storage, the function calls, and an agent's calls to `firenook mcp`.
//
//   node capture.mjs ../../src/data/demo-run.json
//
// The emulator starts in ../terminal/demo-shop, takes the same two orders and
// failing webhook as the terminal recording, and gets three users and three
// product pictures through the MCP tools. Every answer is kept as Firenook
// gave it.

import { spawn } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEMO = join(HERE, '..', 'terminal', 'demo-shop');
const FUNCTIONS = 'http://127.0.0.1:5001/demo-shop/us-central1/';
const out = resolve(process.argv[2] ?? join(HERE, '..', '..', 'src', 'data', 'demo-run.json'));

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
try {
  await ready;
  await wait(1500);
  await post('checkout', { items: [{ sku: 'mug', price: 18, qty: 2 }] });
  await wait(800);
  await post('checkout', { items: [{ sku: 'tote', price: 24, qty: 1 }, { sku: 'pin', price: 4, qty: 2 }] });
  await wait(800);
  await post('stripeWebhook', { type: 'checkout.session.completed' });
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

  for (const user of [
    { email: 'maya@example.com', displayName: 'Maya Chen', password: 'demo-shop-1' },
    { email: 'tom@example.com', displayName: 'Tom Okafor', password: 'demo-shop-2' },
    { phoneNumber: '+15555550123', displayName: 'Priya Nair' },
  ]) {
    await call('auth_create_user', user);
  }
  const svg = (fill) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${fill}"/></svg>`;
  for (const [name, fill] of [
    ['mug', '#f23818'],
    ['tote', '#1c53cf'],
    ['pin', '#ff9800'],
  ]) {
    await call('storage_upload', { path: `products/${name}.svg`, text: svg(fill), contentType: 'image/svg+xml' });
  }
  await wait(1200);

  await call('firestore_query', { collection: 'orders', orderBy: [{ field: 'total', direction: 'desc' }] });
  await call('auth_list_users');
  await call('storage_list', { prefix: 'products/' });
  await call('schedules_list');
  await call('functions_list_calls', { limit: 20 });
  const failed = await call('functions_list_calls', { outcome: 'failed' });
  const id = failed?.calls?.[0]?.id ?? failed?.items?.[0]?.id;
  if (id) await call('functions_get_call', { id });
  await call('rules_evaluate', { service: 'storage', method: 'create', path: 'products/mug.svg' });

  const version = JSON.parse(readFileSync(join(DEMO, 'node_modules', 'firenook', 'package.json'), 'utf8')).version;
  // Stack traces name files by their full path on this machine; the page
  // shows them from the project's folder, as the terminal does.
  const json = JSON.stringify({ version, server: info.serverInfo, capturedAt: new Date().toISOString(), calls }, null, 2);
  writeFileSync(out, `${json.replaceAll(`${DEMO}/`, '')}\n`);
  console.log(`kept ${calls.length} calls in ${out}`);
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
