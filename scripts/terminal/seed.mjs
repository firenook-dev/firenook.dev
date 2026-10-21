// Fills demo-shop with a shop's worth of data, kept in demo-shop/.firenook/state,
// so the recorded screen picks up real data the way a project does on its
// hundredth start, not its first. The same data every time (a seeded random).
//
//   node seed.mjs            # about 1.2 million documents
//   node seed.mjs 0.05       # a twentieth of that, to try it
//
// Starts Firestore, Auth and Storage only, so sendReceipt doesn't run for every
// order, writes through the Admin SDK, then stops, which saves the data.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEMO = join(dirname(fileURLToPath(import.meta.url)), 'demo-shop');
const require = createRequire(join(DEMO, 'functions', 'package.json'));
const scale = Number(process.argv[2] ?? 1);

const counts = {
  products: Math.round(1800 * scale),
  customers: Math.round(64000 * scale),
  orders: Math.round(1100000 * scale),
  reviews: Math.round(42000 * scale),
};

Object.assign(process.env, {
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
});

/** A random number in [0, 1), the same sequence every run. */
let state = 0x2f6b9e1d;
function random() {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (low, high) => low + Math.floor(random() * (high - low + 1));
const id = (prefix, n) => `${prefix}${n.toString(36).padStart(5, '0')}`;

const FIRST = ['Aisha', 'Ben', 'Chen', 'Dara', 'Elif', 'Femi', 'Grace', 'Hiro', 'Ines', 'Jonas', 'Kavya', 'Liam', 'Maya', 'Noor', 'Omar', 'Priya', 'Quinn', 'Rosa', 'Sven', 'Tariq', 'Uma', 'Vera', 'Wei', 'Yusuf', 'Zoe'];
const LAST = ['Adeyemi', 'Becker', 'Costa', 'Dubois', 'Eriksen', 'Fischer', 'García', 'Hassan', 'Ito', 'Jansen', 'Kim', 'Lopez', 'Moreau', 'Nakamura', 'Okafor', 'Petrov', 'Rossi', 'Silva', 'Tanaka', 'Weber'];
const COUNTRIES = ['US', 'GB', 'DE', 'FR', 'NL', 'MY', 'SG', 'IN', 'JP', 'BR', 'CA', 'AU'];
const KINDS = [
  ['mug', 'Mug', 14, 22],
  ['tote', 'Tote bag', 18, 34],
  ['tee', 'T-shirt', 22, 38],
  ['cap', 'Cap', 16, 28],
  ['pin', 'Enamel pin', 4, 9],
  ['poster', 'Poster', 12, 40],
  ['notebook', 'Notebook', 8, 19],
  ['sticker', 'Sticker pack', 3, 7],
];
const COLOURS = ['ember', 'ash', 'cobalt', 'sand', 'moss', 'clay', 'night', 'bone', 'rust'];
const STATUS = ['delivered', 'delivered', 'delivered', 'delivered', 'shipped', 'paid', 'refunded'];
const START = Date.UTC(2023, 0, 1);
const SPAN = Date.UTC(2026, 9, 1) - START;
// A 1×1 PNG: the count is the point, not the pictures.
const PHOTO = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

function startEmulators() {
  const child = spawn('npx', ['firenook', 'emulators:start', '--keep-data', '--only', 'firestore,auth,storage', '--plain'], {
    cwd: DEMO,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return new Promise((resolve, reject) => {
    let seen = '';
    child.stdout.on('data', (chunk) => {
      seen += chunk;
      if (/all emulators ready/i.test(seen)) resolve(child);
    });
    child.on('exit', (code) => reject(new Error(`firenook exited ${code} before it was ready:\n${seen}`)));
  });
}

/** Runs `task(i)` for i in [0, total) with `width` at a time. */
async function pool(total, width, task) {
  let next = 0;
  await Promise.all(
    Array.from({ length: width }, async () => {
      while (next < total) await task(next++);
    }),
  );
}

async function main() {
  const firenook = await startEmulators();
  const { initializeApp } = require('firebase-admin/app');
  const { getFirestore, Timestamp } = require('firebase-admin/firestore');
  const { getAuth } = require('firebase-admin/auth');
  const { getStorage } = require('firebase-admin/storage');
  initializeApp({ projectId: 'demo-shop', storageBucket: 'demo-shop.appspot.com' });
  const db = getFirestore();
  const at = (ms) => Timestamp.fromMillis(Math.floor(ms));
  const began = Date.now();

  /** Writes `total` documents made by `make(i)` as [path, data], 500 to a batch. */
  async function write(name, total, make) {
    const docs = Array.from({ length: total }, (_, i) => make(i));
    await pool(Math.ceil(total / 500), 12, async (b) => {
      const batch = db.batch();
      for (const [path, data] of docs.slice(b * 500, b * 500 + 500)) batch.set(db.doc(path), data);
      await batch.commit();
    });
    console.log(`${name}: ${total.toLocaleString('en')} in ${((Date.now() - began) / 1000).toFixed(1)} s`);
  }

  const products = Array.from({ length: counts.products }, (_, i) => {
    const [kind, label, low, high] = KINDS[i % KINDS.length];
    const colour = pick(COLOURS);
    return { sku: `${kind}-${colour}-${id('', i)}`, name: `${label}, ${colour}`, price: between(low, high), kind };
  });
  await write('products', counts.products, (i) => {
    const p = products[i];
    return [
      `products/${p.sku}`,
      {
        name: p.name,
        kind: p.kind,
        price: p.price,
        stock: between(0, 400),
        photos: ['front', 'back', 'detail'].map((side) => `products/${p.sku}/${side}.png`),
        createdAt: at(START + random() * SPAN * 0.3),
      },
    ];
  });

  const customers = Array.from({ length: counts.customers }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const handle = `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '');
    return { uid: id('u', i), name: `${first} ${last}`, email: `${handle}.${i}@example.com`, country: pick(COUNTRIES), joined: START + random() * SPAN };
  });
  await write('customers', counts.customers, (i) => {
    const c = customers[i];
    return [`customers/${c.uid}`, { name: c.name, email: c.email, country: c.country, joinedAt: at(c.joined) }];
  });

  await write('orders', counts.orders, (i) => {
    const c = customers[Math.floor(random() * customers.length)];
    const items = Array.from({ length: between(1, 4) }, () => {
      const p = products[Math.floor(random() * products.length)];
      return { sku: p.sku, price: p.price, qty: between(1, 3) };
    });
    return [
      `orders/${id('o', i)}`,
      {
        customer: c.uid,
        items,
        total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
        status: pick(STATUS),
        country: c.country,
        createdAt: at(c.joined + random() * (START + SPAN - c.joined)),
      },
    ];
  });

  await write('reviews', counts.reviews, (i) => {
    const c = customers[Math.floor(random() * customers.length)];
    const p = products[Math.floor(random() * products.length)];
    return [`products/${p.sku}/reviews/${id('r', i)}`, { customer: c.uid, stars: pick([5, 5, 5, 4, 4, 3, 2, 1]), createdAt: at(START + random() * SPAN) }];
  });

  const auth = getAuth();
  await pool(Math.ceil(customers.length / 1000), 4, async (b) => {
    const users = customers.slice(b * 1000, b * 1000 + 1000).map((c) => ({
      uid: c.uid,
      email: c.email,
      emailVerified: true,
      displayName: c.name,
      metadata: { creationTime: new Date(c.joined).toUTCString(), lastSignInTime: new Date(c.joined).toUTCString() },
    }));
    const result = await auth.importUsers(users);
    if (result.failureCount) throw new Error(`${result.failureCount} users not imported: ${result.errors[0]?.error.message}`);
  });
  console.log(`users: ${customers.length.toLocaleString('en')} in ${((Date.now() - began) / 1000).toFixed(1)} s`);

  const bucket = getStorage().bucket();
  const photos = products.flatMap((p) => ['front', 'back', 'detail'].map((side) => `products/${p.sku}/${side}.png`));
  await pool(photos.length, 24, (i) => bucket.file(photos[i]).save(PHOTO, { resumable: false, contentType: 'image/png' }));
  console.log(`photos: ${photos.length.toLocaleString('en')} in ${((Date.now() - began) / 1000).toFixed(1)} s`);

  // A stop saves the data, as q does.
  firenook.kill('SIGINT');
  await new Promise((resolve) => firenook.on('exit', resolve));
  const documents = counts.products + counts.customers + counts.orders + counts.reviews;
  console.log(`saved ${documents.toLocaleString('en')} documents, ${customers.length.toLocaleString('en')} users, ${photos.length.toLocaleString('en')} objects`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
