// Facts the whole site uses, in one place.

export const site = {
  name: 'Firenook',
  url: 'https://firenook.dev',
  tagline: 'A drop-in replacement for the Firebase Local Emulator Suite',
  description:
    'Firenook runs the Firebase emulators with your firebase.json, SDKs and ports: 38× faster writes, 9× less memory, no Java, and data that survives restarts.',
  repo: 'https://github.com/firenook-dev/firenook',
  siteRepo: 'https://github.com/firenook-dev/firenook.dev',
  releases: 'https://github.com/firenook-dev/firenook/releases',
  issues: 'https://github.com/firenook-dev/firenook/issues',
  npm: 'https://www.npmjs.com/package/firenook',
  license: 'https://github.com/firenook-dev/firenook/blob/main/LICENSE',
  /** The release the site describes; the terminal was recorded from it. */
  version: '0.2.0-next.7',
  install: 'npm install --save-dev --save-exact firenook',
  requirements: 'Node 24 on macOS, Linux (glibc) or Windows x64',
} as const;

/** The emulators Firenook runs, on the official suite's ports. */
export const services = [
  { name: 'Firestore', port: 8080, highlights: 'Native and web SDKs, realtime listeners, Security Rules, named databases, official import and export' },
  { name: 'Authentication', port: 9099, highlights: 'Every operation of the official Auth emulator: password, email link, phone, anonymous, custom tokens, test sign-in with Google, Apple and other providers, MFA, passkeys, tenants, blocking functions' },
  { name: 'Cloud Storage', port: 9199, highlights: 'Firebase and Cloud Storage APIs, Security Rules evaluated natively, including firestore.get() and exists()' },
  { name: 'Cloud Functions', port: 5001, highlights: 'HTTP, callable and streaming functions; Firestore, Storage, Auth, Pub/Sub, Eventarc, schedule and task-queue triggers; reload on save' },
  { name: 'Extensions', port: 5001, highlights: 'Local, vendored or registry sources, offline once vendored' },
  { name: 'Pub/Sub', port: 8085, highlights: 'Every RPC over gRPC and HTTP/JSON: push, ordering, filters, dead-letter topics, seek, snapshots, Avro schemas' },
  { name: 'Cloud Tasks', port: 9499, highlights: 'Queues for onTaskDispatched with the official retry and rate-limit behaviour' },
  { name: 'Eventarc', port: 9299, highlights: 'Custom events delivered to onCustomEventPublished' },
] as const;

/** Not emulated: a firebase.json that configures them still starts, with a warning. */
export const notEmulated = ['Realtime Database', 'Hosting', 'App Hosting', 'Data Connect'] as const;
