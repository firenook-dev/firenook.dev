// Brings the engine's record of recorded answers into the site.
//
//   node scripts/conformance/import.mjs <cases.json> [--release 0.2.3]
//
// <cases.json> is what the engine's conformance/src/report/cases.mjs writes
// for a release: every answer recorded from the official emulator or from
// production, and the set it belongs to. This writes
//
//   src/data/conformance/summary.json   what the page is built from: per
//                                       service, its sets in wall order
//   public/conformance/<service>.json   its scenarios as runs of blocks, and
//                                       each block's request and answer,
//                                       fetched only when someone points at
//                                       a block
//
// The wall's order: services in the order below, and inside a service the
// answers recorded from production first, then the official emulator's,
// each set's in its own order, so a scenario is one run of blocks.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [source, ...rest] = process.argv.slice(2);
if (!source) {
  console.error('usage: node scripts/conformance/import.mjs <cases.json> --verify <verify.json> [--release <version>]');
  process.exit(2);
}
const option = (name) => {
  const at = rest.indexOf(name);
  return at >= 0 ? (rest[at + 1] ?? null) : null;
};
const release = option('--release');
// What the replays proved, case by case (the engine's
// conformance/src/report/verify.mjs over the ledger a test run wrote). A case
// it does not name was not replayed: the page never claims more than this.
const verified = new Map();
const verifyPath = option('--verify');
if (verifyPath) {
  const verify = JSON.parse(readFileSync(verifyPath, 'utf8'));
  for (const item of verify.cases) verified.set(`${item.set}\u0000${item.id}`, item);
}
const STATES = { checked: 'c', differs: 'd', unreplayed: 'u' };
const ORDER = { c: 0, d: 1, u: 2 };

/** The wall's rows, top to bottom: the engine's service ids, the site's names and icons. */
const SERVICES = [
  { id: 'firestore', name: 'Firestore', art: 'firestore', anchor: 'firestore' },
  { id: 'firestore-rules', name: 'Firestore rules', art: 'rules', anchor: 'firestore-rules' },
  { id: 'auth', name: 'Authentication', art: 'auth', anchor: 'auth' },
  { id: 'storage', name: 'Cloud Storage', art: 'storage', anchor: 'storage' },
  { id: 'storage-rules', name: 'Storage rules', art: 'rules', anchor: 'storage-rules' },
  { id: 'functions', name: 'Cloud Functions', art: 'functions', anchor: 'functions' },
  { id: 'pubsub', name: 'Pub/Sub', art: 'pubsub', anchor: 'pubsub' },
  { id: 'tasks', name: 'Cloud Tasks', art: 'tasks', anchor: 'tasks' },
  { id: 'suite', name: 'Hub and console', art: 'console', anchor: 'console' },
];

const record = JSON.parse(readFileSync(source, 'utf8'));
if (record.schemaVersion !== 1) throw new Error(`unknown schemaVersion ${record.schemaVersion}`);

const known = new Set(SERVICES.map((service) => service.id));
for (const set of record.sets)
  if (!known.has(set.service)) throw new Error(`set ${set.id} names service ${set.service}, which the wall has no row for`);

const casesBySet = new Map();
for (const item of record.cases) {
  if (!casesBySet.has(item.set)) casesBySet.set(item.set, []);
  casesBySet.get(item.set).push(item);
}

const clean = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();
// A recording names its own throwaway project; on the page it is just the project.
// (The engine's case list already names the recordings' own projects and
// buckets as {project}.)
const shown = (text) => clean(text).replace(/projects\/[a-z0-9-]+/g, 'projects/{project}');
// An id written as a slug reads as words: "request-auth-shapes" → "request auth shapes".
const words = (text) => {
  const value = clean(text).replace(/^Expression corpus: /, 'Rules expressions: ');
  const slug = /^(.*?)([a-z0-9]+(?:[-_][a-z0-9]+)+)$/.exec(value);
  return slug ? `${slug[1]}${slug[2].replace(/[-_]/g, ' ')}` : value;
};
// Where an answer came from, in one phrase: the version goes where a reader
// looks for it ("Auth emulator (firebase-tools 15.22.0)").
// "firebase-tools" never breaks at its hyphen.
const keepHyphen = (text) => text.replace(/firebase-tools/g, 'firebase\u2011tools');
const referenceLabel = (name, version) => keepHyphen(label(name, version));
const label = (name, version) => {
  if (!version || name.includes(version)) return name;
  if (/ with /.test(name)) return name.replace(/ with /, ` ${version} with `);
  if (name.endsWith(' (Java)')) return `${name.slice(0, -' (Java)'.length)} ${version}`;
  if (/\(([^)]+)\)$/.test(name)) return name.replace(/\(([^)]+)\)$/, `($1 ${version})`);
  return `${name} ${version}`;
};

const services = [];
mkdirSync(join(root, 'public', 'conformance'), { recursive: true });
for (const service of SERVICES) {
  const sets = record.sets
    .filter((set) => set.service === service.id)
    // Production first, then the official emulator; inside each, the engine's order.
    .sort((a, b) => (a.reference.kind === b.reference.kind ? 0 : a.reference.kind === 'production' ? -1 : 1));
  // The page lists a service's sets by what they cover, so the same calls
  // recorded from production and from the official emulator sit together;
  // the wall keeps production first.
  const listed = (sets) =>
    [...sets].sort((a, b) => a.area.localeCompare(b.area) || (a.kind === b.kind ? 0 : a.kind === 'production' ? -1 : 1));
  const details = [];
  const runs = [];
  const summarySets = [];
  for (const set of sets) {
    const items = casesBySet.get(set.id) ?? [];
    if (items.length !== set.answers)
      throw new Error(`set ${set.id} declares ${set.answers} answers but lists ${items.length}`);
    const first = details.length;
    // Inside a set, what is proved first, then the deliberate differences,
    // then what is not replayed yet, each in the recording's order: a state
    // is one run of blocks on the wall.
    const proved = items
      .map((item, index) => {
        const result = verified.get(`${item.set}\u0000${item.id}`);
        return { item, index, state: STATES[result?.result] ?? 'u', result };
      })
      .sort((a, b) => ORDER[a.state] - ORDER[b.state] || a.index - b.index);
    const counts = { c: 0, d: 0, u: 0 };
    let scenario = null;
    for (const { item, state, result } of proved) {
      counts[state] += 1;
      const title = shown(words(item.scenario)) || shown(words(item.title));
      if (!scenario || scenario.title !== title || scenario.state !== state) {
        scenario = { start: details.length, length: 0, set: summarySets.length, title, state };
        runs.push(scenario);
      }
      scenario.length += 1;
      // Short keys: these files are fetched on a hover.
      details.push({
        t: shown(words(item.title)),
        q: shown(item.request),
        a: shown(item.answer),
        r: state,
        ...(result?.compared ? { k: result.compared } : {}),
        ...(state === 'd' && result?.reason ? { w: clean(result.reason) } : {}),
      });
    }
    summarySets.push({
      id: set.id,
      area: clean(set.area),
      kind: set.reference.kind,
      reference: clean(set.reference.name),
      version: set.reference.version ?? null,
      label: referenceLabel(clean(set.reference.name), set.reference.version ?? null),
      recordedAt: set.recordedAt ?? null,
      scenarios: set.scenarios,
      answers: set.answers,
      checked: counts.c,
      differs: counts.d,
      unreplayed: counts.u,
      start: first,
    });
  }
  // The wall's runs: one per set, reference and state, in wall order.
  const spans = summarySets.flatMap((set) => {
    const out = [];
    let at = set.start;
    for (const [state, length] of [['c', set.checked], ['d', set.differs], ['u', set.unreplayed]]) {
      if (length > 0) out.push([at, length, set.kind, state]);
      at += length;
    }
    return out;
  });
  const production = summarySets.filter((set) => set.kind === 'production').reduce((sum, set) => sum + set.answers, 0);
  services.push({
    ...service,
    answers: details.length,
    production,
    official: details.length - production,
    scenarios: summarySets.reduce((sum, set) => sum + set.scenarios, 0),
    checked: summarySets.reduce((sum, set) => sum + set.checked, 0),
    differs: summarySets.reduce((sum, set) => sum + set.differs, 0),
    unreplayed: summarySets.reduce((sum, set) => sum + set.unreplayed, 0),
    checkedProduction: summarySets.filter((set) => set.kind === 'production').reduce((sum, set) => sum + set.checked, 0),
    sets: summarySets,
    spans,
    listed: listed(summarySets).map((set) => summarySets.indexOf(set)),
  });
  // The scenarios as runs of blocks, [first, length, set, title], and each
  // block's request and answer: what a hover shows.
  writeFileSync(
    join(root, 'public', 'conformance', `${service.id}.json`),
    JSON.stringify({ runs: runs.map((run) => [run.start, run.length, run.set, run.title]), cases: details }),
  );
}

const total = services.reduce((sum, service) => sum + service.answers, 0);
const production = services.reduce((sum, service) => sum + service.production, 0);
const summary = {
  release,
  importedAt: new Date().toISOString().slice(0, 10),
  total,
  production,
  official: total - production,
  scenarios: services.reduce((sum, service) => sum + service.scenarios, 0),
  checked: services.reduce((sum, service) => sum + service.checked, 0),
  differs: services.reduce((sum, service) => sum + service.differs, 0),
  unreplayed: services.reduce((sum, service) => sum + service.unreplayed, 0),
  checkedProduction: services.reduce((sum, service) => sum + service.checkedProduction, 0),
  services,
};
mkdirSync(join(root, 'src', 'data', 'conformance'), { recursive: true });
writeFileSync(join(root, 'src', 'data', 'conformance', 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(
  `${total} answers (${production} from production) in ${services.length} services: ` +
    `${summary.checked} checked, ${summary.differs} differ on purpose, ${summary.unreplayed} not replayed yet` +
    (verifyPath ? '' : ' (no --verify: nothing counts as checked)'),
);
for (const service of services)
  console.log(`  ${service.name.padEnd(16)} ${String(service.answers).padStart(5)}  production ${String(service.production).padStart(5)}  sets ${service.sets.length}  scenarios ${service.scenarios}`);
