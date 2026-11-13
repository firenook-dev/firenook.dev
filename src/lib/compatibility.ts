// What each part of Firenook covers in the release the site describes, and
// what it does not: COMPATIBILITY.md in the engine repository at that
// release, in plain words. /compatibility shows it; the ids are its anchors,
// which the service list in site.ts links to.

export interface Surface {
  id: string;
  name: string;
  port?: string;
  /** One sentence on what it is checked against. */
  summary: string;
  covers: string[];
  notClaimed: string[];
  /** Where it deliberately behaves otherwise than the official emulator. */
  differs?: string[];
}

export const record = 'https://github.com/firenook-dev/firenook/blob/npm-v0.2.4/COMPATIBILITY.md';

export const surfaces: Surface[] = [
  {
    id: 'firestore',
    name: 'Firestore',
    port: '8080',
    summary: 'The native, Admin and web SDKs’ paths, Security Rules and realtime listeners, with data on disk.',
    covers: [
      'The native and Admin SDKs over gRPC, the web SDK over WebChannel, and REST',
      'Realtime listeners, queries, transactions and batched writes',
      'Security Rules, per database, reloaded a second after you save the file, with each denial naming the rule line that decided it',
      'Who a request is from, read as the official emulator reads it on gRPC, REST and WebChannel, so signed-out clients meet the rules and @firebase/rules-unit-testing works',
      'Named databases: every database the app names, exported together; a database that firebase.json does not list follows the default database’s rules',
      'Every REST v1 method the official emulator answers, createDocument included',
      'orderBy, range filters and cursors served from an ordered index',
      'Queries that name no collection, as the Admin SDK’s recursiveDelete() sends them',
      'A query whose composite index firestore.indexes.json does not declare: answered and warned of once with the entry to add, listed on the console’s Indexes page, which adds it to the file, or refused with --strict-indexes',
      'Import and export in the official format, both ways',
      'Data on disk with a write-ahead log; acknowledged writes durable within a second',
      'Timestamps stored to the microsecond, as production stores them',
    ],
    notClaimed: ['Every production feature, edition or client version'],
    differs: [
      'The official emulator refuses more than one database and then loads no rules; Firenook serves them all.',
      'A rules file that does not compile leaves the rules in force serving requests, and the console shows the errors beside the file.',
      'Transactions are optimistic: a write that conflicts with a read-write transaction succeeds and the transaction’s commit is aborted, where the official emulator holds a lock and aborts the write.',
      'Over REST, Firenook keeps production’s behaviour where the official adapter departs from it, such as answering partitionQuery.',
    ],
  },
  {
    id: 'auth',
    name: 'Authentication',
    port: '9099',
    summary: 'Every operation the official Auth emulator implements, 61 of them, each checked against its recorded answers.',
    covers: [
      'Password, anonymous, custom token, email link and phone sign-in',
      'Test sign-in with Google, Apple, SAML and OIDC-shaped credentials, through the local popup and redirect pages',
      'Account updates and deletes, codes and links, session cookies, and custom claims held to the 1,000-character limit',
      'Tenants, SMS multi-factor and passkeys',
      'The Admin SDK’s batch create, get, delete and query',
      'Blocking functions, listed in the project config and turned off or replaced through it, and lifecycle triggers',
      'Import and export in the official format',
    ],
    notClaimed: [
      'What the official emulator answers with 501 too: provider configuration, initializeAuth, IAM on tenants, Game Center, reCAPTCHA enforcement and TOTP multi-factor',
      'Real email or SMS delivery: codes and links wait in the console’s inbox',
      'Production token verification',
    ],
  },
  {
    id: 'storage',
    name: 'Cloud Storage',
    port: '9199',
    summary: 'The Firebase and Cloud Storage paths, with Security Rules evaluated natively, with no Java.',
    covers: [
      'Uploads, downloads, metadata, gzip and pagination on the Firebase and Cloud Storage APIs',
      'Uploads as the native iOS and Android SDKs and browsers send them, checked with the real clients',
      'A download token for an object the Admin SDK saved, made on its first Firebase read as the official emulator makes it, so getDownloadURL() works',
      'Several buckets through storage targets, each target’s rules applied to every bucket it maps to',
      'Security Rules with production’s request model, including firestore.get() and exists()',
      'Rules files reloaded when you save them, with or without Firestore running',
      'Import and export in the official format',
    ],
    notClaimed: ['Every Cloud Storage feature'],
    differs: [
      'Rules follow production where the official emulator does not: prefix-template list matching and request.method.',
      'Resumable uploads left idle for seven days are removed, as production expires them; the official emulator keeps them.',
    ],
  },
  {
    id: 'functions',
    name: 'Cloud Functions',
    port: '5001',
    summary: 'Your functions on the Node that runs Firenook, in its own runtime, one worker per codebase, found through the SDK as the Firebase CLI finds them.',
    covers: [
      'HTTP, callable and streaming functions',
      'Firestore, Storage, Auth, Pub/Sub, Eventarc, schedule and task-queue triggers, and blocking Auth functions; a trigger on a service the suite does not run is listed with a warning',
      'Params with their defaults, as the Firebase CLI resolves them without a terminal',
      '.env files, .env.<alias> included, and .secret.local secrets',
      'Reload when you save, TypeScript compiled as you save with --build, and --inspect-functions for a debugger',
      'Every call kept with its request or event, its answer, its timing and its log lines (the last 2,000)',
    ],
    notClaimed: [
      'Python and Dart functions',
      'Secret Manager',
      'Firebase Alerts: an alert function is listed and receives nothing',
      'A network sandbox: your code can still reach the internet',
      'Request headers named x-firenook-*, which are Firenook’s own and removed before your function sees them',
    ],
  },
  {
    id: 'extensions',
    name: 'Extensions',
    port: '5001',
    summary: 'Extensions resolved and run by Firenook, from local, vendored, cached or registry sources.',
    covers: [
      'Parameters, specs and triggers as the official emulator reads them',
      'Local, vendored, cached and registry sources; ext:vendor copies registry ones into the project',
      'An instance’s parameter files watched, and the instance reloaded when they change',
      'An instance whose triggers need a service Firenook does not emulate or does not start is left out and named',
    ],
    notClaimed: ['Extensions defined in code', 'Lifecycle tasks (onInstall, onUpdate, onConfigure), as on the official emulator', 'Secret Manager'],
  },
  {
    id: 'pubsub',
    name: 'Pub/Sub',
    port: '8085',
    summary: 'Every RPC of the official emulator over gRPC and HTTP/JSON on one port, each checked against its recorded answers.',
    covers: [
      'Topics, publishing, subscriptions, pull, streaming pull and push delivery with retries',
      'Ack deadlines, redelivery, dead-letter and retry policies, ordering keys and filters',
      'Retention, seek and snapshots',
      'Avro schemas with revisions, bound to topics',
      'Functions on topics, and schedules in their own time zone',
    ],
    notClaimed: [
      'Protocol Buffer schemas, IAM, detachSubscription and updateSnapshot (the official emulator answers 501 too)',
      'BigQuery, Cloud Storage and Bigtable export subscriptions',
      'Keeping messages across restarts (the official emulator does not either)',
    ],
    differs: [
      'An acknowledged message is dropped once nothing can bring it back.',
      'A topic’s history is a bounded ring: the newest 5,000 messages and 16 MiB, or its retention window up to 100,000 messages.',
      'A message forwarded to a dead-letter topic reaches the functions listening there.',
    ],
  },
  {
    id: 'tasks',
    name: 'Cloud Tasks',
    port: '9499',
    summary: 'The official emulator’s four routes and its dispatcher, checked against its recorded answers.',
    covers: [
      'A queue for each onTaskDispatched function',
      'Rate limits, dispatch slots, the X-CloudTasks-* headers, the retry ladder and its backoff, and dispatchDeadline',
      'The Admin SDK’s taskQueue().enqueue() and delete()',
      'In the console: pause, resume and purge queues, and run, stop and delete tasks',
    ],
    notClaimed: [
      'What the official emulator does not do either: scheduleTime as a delay, OIDC tokens, and the Cloud Tasks v2 API',
      'Pausing, purging and listing through the API: the console’s controls are not an API',
      'Keeping tasks across restarts',
    ],
  },
  {
    id: 'eventarc',
    name: 'Eventarc',
    port: '9299',
    summary: 'Custom events delivered to your functions, on the Firebase channel and named channels.',
    covers: [
      'Trigger registration, getTriggers and publishEvents',
      'Delivery to onCustomEventPublished functions by event type and filters',
      'Every event kept with what each function did with it, including events nothing listens for (the last 1,000)',
    ],
    notClaimed: ['Firebase Alerts on the native channel'],
  },
  {
    id: 'console',
    name: 'Hub and console',
    port: '4400 and 4000',
    summary: 'The hub’s discovery and control paths, and Firenook’s own console at /console on the Emulator UI’s port.',
    covers: [
      'The hub’s discovery, control and logging paths, and /api/config',
      'A console for every service the suite runs, live, at /console',
      'The Emulator UI’s old page addresses, which lead to the console page for the same thing',
    ],
    notClaimed: ['Google’s Emulator UI itself, which the console replaces', 'Its Firebase Alerts test page'],
  },
  {
    id: 'cli',
    name: 'The CLI',
    summary: 'The Firebase CLI’s emulator commands, and Firenook’s own for data and agents.',
    covers: [
      'emulators:start and emulators:exec with --only, --import, --export-on-exit, --inspect-functions and the other official flags, and --build for TypeScript',
      'emulators:export on a running suite, firestore:delete and functions:invoke',
      'init in a terminal: one screen of choices, then the installs, the first build and the emulators; init --adopt for a project you have',
      'use, target:apply and target:clear, and doctor',
      'ext:vendor, mcp, and keeping data between runs',
    ],
    notClaimed: ['functions:shell (use functions:invoke)', 'Deploying and logging in: keep firebase-tools for those'],
  },
  {
    id: 'configuration',
    name: 'Configuration',
    summary: 'firebase.json and .firebaserc read as the Firebase CLI reads them.',
    covers: [
      'Which emulators run, derived from firebase.json as the official CLI derives it',
      'Every service’s port, Eventarc, Tasks, logging and the Firestore WebSocket included',
      'A storage entry as an object, an array or absent, and a firestore entry as an object or a list of databases',
      'Any project id, demo or real, and a missing .firebaserc',
      'Any listen host; a wildcard host still gives loopback addresses to connect to',
    ],
    notClaimed: ['Listen hosts that differ from service to service'],
  },
];

export const notEmulated = {
  services: ['Realtime Database', 'Hosting', 'App Hosting', 'Data Connect', 'universal extensions'],
  text: 'A firebase.json that configures them still starts: those emulators are skipped, with a warning.',
};

export const platforms = {
  supported: [
    'macOS on Apple silicon and Intel',
    'Linux x64 and arm64 with glibc 2.28 or newer (RHEL 8, Debian 10, Ubuntu 20.04, node:24-slim and later)',
    'Windows x64',
  ],
  node: 'Node 22, 24 or 26 runs the emulators, and your functions run on it; npx firenook itself runs on Node 20 and later.',
  notQualified: ['Linux with musl (Alpine) or a glibc older than 2.28', 'Windows on Arm and 32-bit Windows', 'durability on network file systems', 'recovery from power loss on Windows'],
};

/**
 * What is wrong in this release, found while the docs were checked against
 * it, each with where the docs show the way around it. Fixes are tracked in
 * the engine repository.
 */
export const knownIssues: { area: string; text: string; href: string }[] = [
  {
    area: 'init',
    text: 'The emulators script that init writes starts with `--keep-data`, which needs Firestore, Auth and Storage together, so a project made without Auth or Storage does not start with it.',
    href: '/docs/get-started/new-project',
  },
  {
    area: 'Cloud Functions',
    text: 'A save that stops a codebase loading is shown on the terminal screen only: plain output and the log say nothing, and the code loaded before keeps answering.',
    href: '/docs/functions/debugging',
  },
  {
    area: 'Cloud Functions',
    text: 'A function you remove, rename or move to another region keeps its old route until a restart, and a call there fails.',
    href: '/docs/services/functions',
  },
  {
    area: 'functions:invoke',
    text: 'A scheduled function answers 404 unless you pass `--event-data \'{}\'`.',
    href: '/docs/functions/scheduled',
  },
];

/**
 * Where the official emulator and production disagree, what Firenook does,
 * from COMPATIBILITY.md in the engine repository. `follows` says whose answer
 * Firenook gives, so the page can mark it.
 */
export interface Choice {
  area: string;
  behaviour: string;
  official: string;
  production: string;
  firenook: string;
  follows: 'production' | 'yours';
}

export const choices: Choice[] = [
  {
    area: 'Firestore',
    behaviour: 'A query whose composite index the index file does not declare',
    official: 'Answers it, so the test passes',
    production: 'Refuses it with `FAILED_PRECONDITION`',
    firenook: 'Answers it and lists the index to add, which the console’s Indexes page writes into the file; --strict-indexes refuses it as production does',
    follows: 'yours',
  },
  {
    area: 'Firestore',
    behaviour: 'More than one database',
    official: 'Refuses the second database, then loads no rules at all',
    production: 'Serves each named database with its rules',
    firenook: 'Serves every database the app names, each with its own rules',
    follows: 'production',
  },
  {
    area: 'Firestore',
    behaviour: 'Two transactions that touch the same document',
    official: 'Holds a lock and aborts the other write',
    production: 'Optimistic in the web and mobile SDKs; server libraries take locks',
    firenook: 'Optimistic: the other write lands and the transaction is aborted to retry',
    follows: 'production',
  },
  {
    area: 'Firestore REST',
    behaviour: '`partitionQuery`',
    official: '`UNIMPLEMENTED`',
    production: 'Answers it',
    firenook: 'Answers it',
    follows: 'production',
  },
  {
    area: 'Firestore REST',
    behaviour: 'A `readTime` or `transaction` given to get and list',
    official: 'Refuses `readTime` and never answers a `transaction`',
    production: 'Reads at that time, or in that transaction',
    firenook: 'Reads at that time, or in that transaction',
    follows: 'production',
  },
  {
    area: 'Cloud Storage',
    behaviour: 'A resumable upload left unfinished',
    official: 'Keeps it for ever',
    production: 'Expires the session after a week',
    firenook: 'Removes it and its bytes after seven idle days',
    follows: 'production',
  },
];

/**
 * Differences people found and the release that fixed them, from the engine
 * repository's issues. Every fix landed with a test; `recorded` marks the
 * ones that also added answers recorded from the official emulator.
 */
export interface Found {
  number: number;
  /** An issue, or a pull request that found and fixed one itself. */
  kind: 'issue' | 'pull';
  area: string;
  text: string;
  recorded: boolean;
}

export const found: { release: string; date: string | null; items: Found[] }[] = [
  {
    release: '0.2.3',
    date: '2026-11-12',
    items: [
      { number: 169, kind: 'issue', area: 'Firestore', text: 'A transaction that reads a missing document with a single-document get was not checked for a conflict at commit, so two could both write it.', recorded: false },
      { number: 174, kind: 'issue', area: 'Cloud Storage', text: 'A file the Admin SDK saved had no download token, so the web SDK’s `getDownloadURL` failed.', recorded: false },
      { number: 175, kind: 'issue', area: 'Authentication', text: 'The project config listed no blocking functions, and a `PATCH` that turns them off was ignored.', recorded: false },
    ],
  },
  {
    release: '0.2.2',
    date: '2026-11-11',
    items: [
      { number: 138, kind: 'issue', area: 'Firestore rules', text: 'The conditional operator `c ? a : b` was refused as an unexpected character.', recorded: true },
      { number: 153, kind: 'pull', area: 'Firestore rules', text: 'A function declared outside the service block was refused.', recorded: true },
      { number: 154, kind: 'pull', area: 'Firestore rules', text: 'In a list rule, `\'f\' in resource.data` was decided differently from the official emulator.', recorded: true },
      { number: 143, kind: 'issue', area: 'Firestore rules', text: 'A query pinned to a missing document by its ID was allowed where the official emulator denies it.', recorded: true },
      { number: 168, kind: 'pull', area: 'Firestore rules', text: 'A query filter other than “is null” did not count as proof that its field holds a value.', recorded: true },
      { number: 139, kind: 'issue', area: 'Firestore rules', text: 'A function’s return without a trailing semicolon failed to compile.', recorded: false },
      { number: 140, kind: 'issue', area: 'Firestore rules', text: '`resource.data.get()` in a list rule failed with “method get is not available”.', recorded: false },
      { number: 141, kind: 'issue', area: 'Firestore rules', text: 'Indexing a string, `s[0]`, failed with “value cannot be indexed”.', recorded: false },
      { number: 142, kind: 'issue', area: 'Firestore rules', text: '`resource != null` in a list rule “did not evaluate to a boolean”.', recorded: false },
      { number: 144, kind: 'issue', area: 'Firestore', text: 'Updating a missing document answered `NOT_FOUND` even when the rules deny the update.', recorded: false },
      { number: 155, kind: 'issue', area: 'Firestore', text: 'The Admin SDK’s `recursiveDelete()` failed with `UNAVAILABLE`.', recorded: true },
      { number: 158, kind: 'issue', area: 'Firestore REST', text: '`nullValue: null` was refused on a write, and the list endpoint answered `"NULL_VALUE"`.', recorded: false },
      { number: 157, kind: 'issue', area: 'Cloud Storage', text: 'Listing with an empty `delimiter=` returned no items.', recorded: false },
    ],
  },
];
