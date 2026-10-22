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

export const record = 'https://github.com/firenook-dev/firenook/blob/npm-v0.2.0/COMPATIBILITY.md';

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
      'Named databases: every database the app names, exported together; a database firebase.json does not list follows the default database’s rules',
      'Every REST v1 method the official emulator answers, createDocument included',
      'orderBy, range filters and cursors served from an ordered index',
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
    summary: 'Every operation the official Auth emulator implements, 61 of them, replayed from a 1,068-step record of its answers.',
    covers: [
      'Password, anonymous, custom token, email link and phone sign-in',
      'Test sign-in with Google, Apple, SAML and OIDC-shaped credentials, through the local popup and redirect pages',
      'Account updates and deletes, codes and links, session cookies, and custom claims held to the 1,000-character limit',
      'Tenants, SMS multi-factor and passkeys',
      'The Admin SDK’s batch create, get, delete and query',
      'Blocking functions and lifecycle triggers',
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
    summary: 'Every RPC of the official emulator over gRPC and HTTP/JSON on one port, replayed from a 916-step record of its answers.',
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
    summary: 'The official emulator’s four routes and its dispatcher, replayed from a 61-step record of its answers.',
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
    port: '4400, 4000',
    summary: 'The hub’s discovery and control paths, and Firenook’s own console at /console on the Emulator UI’s port.',
    covers: [
      'The hub’s discovery, control and logging paths, and /api/config',
      'A console for every service the suite runs, live, at /console',
      'The Emulator UI’s old page addresses, which lead to the console page for the same thing',
    ],
    notClaimed: ['Google’s Emulator UI itself, not served since 0.2.0-next.3', 'Its Firebase Alerts test page'],
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
 * What is wrong in this release, found while the docs were written against
 * it, each with where the docs show the way around it. Fixes are tracked in
 * the engine repository.
 */
export const knownIssues: { area: string; text: string; href: string }[] = [
  {
    area: 'Firestore',
    text: 'A gRPC request with no token at all, as the native and Admin-style SDKs send when signed out, is treated as an admin request and skips the Security Rules.',
    href: '/docs/services/firestore',
  },
  {
    area: 'Security Rules',
    text: '@firebase/rules-unit-testing: authenticatedContext() makes a token Firestore rejects, and initializeTestEnvironment() cannot load Firestore rules (415).',
    href: '/docs/services/rules',
  },
  {
    area: 'Firestore',
    text: 'A database firebase.json does not list has no rules until a project-wide rules update, so every request to it is allowed.',
    href: '/docs/services/firestore',
  },
  {
    area: 'Cloud Storage',
    text: 'A storage target mapped to several buckets applies its rules to the first bucket only.',
    href: '/docs/services/storage',
  },
  {
    area: 'Cloud Functions',
    text: 'Params’ defaults (defineString and the rest) are not applied, and .env.<alias> files are not read.',
    href: '/docs/functions/environment',
  },
  {
    area: 'emulators:exec',
    text: 'CLOUD_TASKS_EMULATOR_HOST and CLOUD_EVENTARC_EMULATOR_HOST are not set for your command; set them yourself.',
    href: '/docs/get-started/tests',
  },
  {
    area: 'Two suites',
    text: 'Two suites with the same project id on one machine find each other’s hub, and the first one’s stop fails. Give each its own project id.',
    href: '/docs/reference/ports',
  },
];
