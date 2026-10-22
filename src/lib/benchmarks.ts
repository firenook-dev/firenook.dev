// The figures the site quotes from the benchmark of 0.2.0 against the
// official emulator (firebase-tools 15.22.0 on Java 26), measured on 21–22
// October 2026. The record is benchmarks/020-paired-acceptance.json in the
// engine repository and docs/benchmarks.md gives it in full; the method is
// on /benchmarks.

export const benchmark = {
  release: '0.2.0',
  official: 'firebase-tools 15.22.0 on Java 26',
  measured: '21–22 October 2026',
  record: 'https://github.com/firenook-dev/firenook/blob/main/benchmarks/020-paired-acceptance.json',
  page: 'https://github.com/firenook-dev/firenook/blob/main/docs/benchmarks.md',
  machine: 'one AMD Ryzen 5 3600 server with 64 GiB',
  application: 'a real application with 211,205 Firestore documents and 6.7 GB in Storage',
  queryShapes: 26,
  queryShapesFaster: 25,
} as const;

export interface Pair {
  label: string;
  unit: string;
  official: number;
  firenook: number;
  /** The comparison as the benchmark states it, every multiple rounded down. */
  claim: string;
}

/** The rows of the published chart, in its order. Lower is better on every row. */
export const pairs: Pair[] = [
  { label: 'Memory at peak', unit: 'GiB', official: 22.57, firenook: 2.11, claim: '10× less' },
  { label: 'Write, median', unit: 'ms', official: 208.2, firenook: 5.1, claim: '40× faster' },
  { label: 'Listener update, median', unit: 'ms', official: 209, firenook: 11, claim: '19× faster' },
  { label: 'Restart with data kept', unit: 's', official: 30.8, firenook: 0.59, claim: '52× sooner' },
  { label: 'orderBy, limit 20', unit: 'ms', official: 96.3, firenook: 12.0, claim: '8× faster' },
  { label: 'CPU over two hours', unit: 's', official: 1586, firenook: 616, claim: '61% less' },
];

// The rest of the record, as docs/benchmarks.md in the engine repository
// gives it, for /benchmarks.

export const host = {
  machine: 'An AMD Ryzen 5 3600 (6 cores, 12 threads) with 64 GiB of memory and NVMe storage, Ubuntu 24.04, Node 24.20.0',
  data: '211,205 Firestore documents, 33,352 Storage objects (6.7 GB) and one Auth user',
  traffic:
    'Writes from two busy sessions, open listeners, a filtered query every 15 seconds, a Firestore-triggered function, and a Storage upload, metadata read, download and delete, plus an idle second client issuing the same reads.',
  counted: '5,280 writes and 60,000 listener updates per emulator, every one delivered',
};

/** Two hours of the application's traffic: median and 99th percentile, ms. */
export const traffic = [
  { label: 'Write, acknowledged', official: [208.2, 279.8], firenook: [5.1, 50.6], faster: '40×' },
  { label: 'Listener update after a write', official: [209, 258], firenook: [11, 60], faster: '19×' },
  { label: 'Filtered query under load', official: [33.1, 44.1], firenook: [6.6, 31.0], faster: '5.0×' },
  { label: 'The same query from an idle client', official: [32.6, 43.8], firenook: [7.1, 30.9], faster: '4.5×' },
  { label: 'Firestore-triggered function', official: [3.8, 8.02], firenook: [3.11, 4.49], faster: '1.2×' },
  { label: 'Storage upload, metadata, download, delete', official: [17.8, 26.8], firenook: [8.6, 11.8], faster: '2.0×' },
] as const;

export const resources = [
  { label: 'Emulator memory, peak (PSS)', official: '22.57 GiB (Java)', firenook: '2.11 GiB' },
  { label: 'Emulator memory, first → last sample', official: '15.42 → 22.57 GiB', firenook: '1.64 → 1.67 GiB' },
  { label: 'Whole stack, peak (emulator and application)', official: '38.83 GiB', firenook: '17.43 GiB' },
  { label: 'Emulator CPU time', official: '1,586 s', firenook: '616 s' },
  { label: 'Disk written by the whole server', official: '3.66 GB', firenook: '1.83 GB' },
] as const;

/** Firestore, Auth and Storage with the same data, no application. */
export const restarts = [
  { label: 'First start, importing the data', official: '56.7 s', firenook: '28.3 s' },
  { label: 'Start again with the data', official: '30.7–31.7 s', firenook: '0.59–0.60 s' },
  { label: 'Stop with the data saved', official: '54–58 s (export)', firenook: '0.05–0.26 s' },
  { label: 'Memory once ready', official: '6.9 GiB', firenook: '0.16 GiB' },
  { label: 'Memory after the 26 query shapes', official: '11.9 GiB', firenook: '0.65 GiB' },
] as const;

/** The first start of 0.2.0 on a store 0.2.0-next.8 wrote: 211,202 documents, 3.3 GB. */
export const upgrade = [
  { label: 'First start, building the ordered index', ready: '8.0 s', note: '7.4 s of it indexing' },
  { label: 'Every start after', ready: '0.61 s', note: '' },
] as const;

/**
 * The same data grown by 2,500,000 small documents (2,711,202 in a 7.4 GB
 * store, 9.81 GB exported), four queries on the grown collection, ms at the
 * median. The official emulator on Java's defaults ran out of memory at the
 * first query.
 */
export const grown = {
  columns: ['Official, Java defaults', 'Official, 24 GiB heap', '0.2.0-next.8', '0.2.0'],
  start: ['50.3 s, then out of memory', '55.2 s', '0.55–0.57 s', '0.62 s'],
  memory: ['14.5 → 16.2 GiB', '20.7 → 24.7 GiB', '0.10–0.16 GiB', '0.11 GiB'],
  queries: [
    { shape: 'orderBy a timestamp, descending, limit 20', official: 8550, next8: 5128, firenook: 4.3 },
    { shape: 'Range on an integer, limit 20', official: 8205, next8: 4023, firenook: 3.2 },
    { shape: '== plus orderBy descending, limit 20', official: 14124, next8: 5.4, firenook: 5.6 },
    { shape: '== on a string, limit 20', official: 27562, next8: 4.3, firenook: 3.4 },
  ],
  firstOpen: '49.9 s, 49.3 s of it indexing 2,711,202 documents',
} as const;

/** 26 query shapes over gRPC, each warmed once then run 25 times; 0.2.0's figure is the median of three rounds. ms. */
export const queryShapes: { shape: string; official: [number, number]; firenook: [number, number]; times: string }[] = [
  { shape: 'Document id in 10 ids', official: [615, 646], firenook: [13.4, 22.7], times: '46.0×' },
  { shape: 'Collection, limit 1', official: [88.6, 90.4], firenook: [2.6, 3.32], times: '34.1×' },
  { shape: 'Small collection: == on a string', official: [28.3, 28.7], firenook: [1.68, 1.79], times: '16.8×' },
  { shape: 'count() of a collection', official: [86.1, 88.8], firenook: [7.99, 9.21], times: '10.8×' },
  { shape: 'array-contains', official: [724, 739], firenook: [70.5, 83.1], times: '10.3×' },
  { shape: 'orderBy an integer field, limit 20', official: [96.3, 111], firenook: [12.0, 25.0], times: '8.0×' },
  { shape: 'Range on an integer field, limit 20', official: [95.5, 118], firenook: [13.2, 22.2], times: '7.2×' },
  { shape: '== on a boolean, limit 20', official: [108, 118], firenook: [15.3, 23.9], times: '7.0×' },
  { shape: '== plus orderBy on another field', official: [99.3, 113], firenook: [14.7, 23.8], times: '6.8×' },
  { shape: 'Five cursor pages of 20', official: [489, 515], firenook: [74.8, 86.7], times: '6.5×' },
  { shape: '== on a string field', official: [124, 139], firenook: [20.0, 29.7], times: '6.2×' },
  { shape: 'array-contains-any of 5 values', official: [352, 443], firenook: [61.0, 84.5], times: '5.8×' },
  { shape: 'Second collection: array-contains plus orderBy a timestamp', official: [37.3, 44.9], firenook: [7.62, 15.8], times: '4.9×' },
  { shape: 'orderBy a timestamp, descending, limit 20', official: [109, 125], firenook: [24.7, 36.0], times: '4.4×' },
  { shape: 'Collection group, limit 20', official: [57.0, 68.0], firenook: [14.2, 22.8], times: '4.0×' },
  { shape: 'count() with == on a boolean', official: [83.8, 104], firenook: [24.6, 29.8], times: '3.4×' },
  { shape: 'offset 1000, limit 20', official: [102, 109], firenook: [32.0, 45.7], times: '3.2×' },
  { shape: 'Collection, limit 100', official: [210, 231], firenook: [78.3, 92.4], times: '2.7×' },
  { shape: 'Second collection: == on a boolean, limit 50', official: [116, 131], firenook: [45.2, 63.7], times: '2.6×' },
  { shape: 'Second collection: == plus !=', official: [61.4, 73.7], firenook: [26.5, 38.2], times: '2.3×' },
  { shape: 'Listener: first snapshot of 20 documents', official: [115, 133], firenook: [51.0, 62.1], times: '2.2×' },
  { shape: 'Batch get of 50 documents', official: [80.6, 165], firenook: [43.8, 58.4], times: '1.8×' },
  { shape: 'Get one document by id', official: [5.26, 20.6], firenook: [3.31, 4.74], times: '1.6×' },
  { shape: 'Write one document, then delete it', official: [3.01, 4.16], firenook: [1.96, 3.56], times: '1.5×' },
  { shape: 'Transaction: read, modify, write', official: [5.51, 5.97], firenook: [3.95, 12.5], times: '1.4×' },
  { shape: 'Ids only, limit 500', official: [97.8, 142], firenook: [98.3, 115], times: 'tie' },
];

/** The six shapes the official emulator answered faster in the 0.2.0-next.6 run, p50 ms. */
export const orderedShapes = [
  { shape: 'orderBy an integer field, limit 20', next8: 177, firenook: 12.0, official: 96.3 },
  { shape: 'orderBy a timestamp, descending, limit 20', next8: 198, firenook: 24.7, official: 109 },
  { shape: 'Range on an integer field, limit 20', next8: 174, firenook: 13.2, official: 95.5 },
  { shape: '== plus orderBy on another field', next8: 107, firenook: 14.7, official: 99.3 },
  { shape: 'Five cursor pages of 20', next8: 875, firenook: 74.8, official: 489 },
  { shape: 'Batch get of 50 documents', next8: 115, firenook: 43.8, official: 80.6 },
] as const;

/** 2,000 writes one at a time, each confirmed by a listener, then 4,000 from eight writers. */
export const writesAlone = [
  { round: 1, release: '0.2.0-next.8', write: '0.67 / 1.33 ms', listener: '0.74 ms', eight: '2,919 writes/s' },
  { round: 2, release: '0.2.0', write: '0.67 / 1.17 ms', listener: '0.73 ms', eight: '3,078 writes/s' },
  { round: 3, release: '0.2.0-next.8', write: '0.61 / 1.32 ms', listener: '0.66 ms', eight: '3,139 writes/s' },
  { round: 4, release: '0.2.0', write: '0.62 / 1.12 ms', listener: '0.68 ms', eight: '3,374 writes/s' },
] as const;

/** The earlier runs on the same server, kept in the engine repository. */
export const earlier = [
  {
    label: '0.2.0-next.6, 18–19 October 2026',
    href: 'https://github.com/firenook-dev/firenook/blob/main/benchmarks/next6-paired-acceptance.json',
  },
  {
    label: '0.2.0-next.7 checked against 0.2.0-next.6',
    href: 'https://github.com/firenook-dev/firenook/blob/main/benchmarks/next7-regression.json',
  },
] as const;

export const fairness = [
  'One emulator at a time on an otherwise idle server, from a clean start, swap emptied before each stack started.',
  'The official emulator ran with Java’s default settings, as a developer gets it, except where a row says otherwise. Firenook ran its defaults: data on disk, acknowledged writes durable within a second.',
  'Same data, same application revision, same workload; the run fails unless both stacks end with identical data.',
  'Both stacks started the application with an empty build cache.',
  'Every percentile is computed from all recorded operations, and an independent audit recomputed every figure from the raw samples and verified the 95 checksummed evidence files.',
  'The application’s own scheduled jobs were kept outside both measuring windows.',
] as const;

export const limits = [
  'One server and one application. Measure your own workload before relying on these numbers.',
  'The official stack used more memory than the server could hold: it already had 7.7 GB in swap when its two hours began and paged out 3.1 GB more, against 1.6 GB and nothing more on Firenook. On a machine with more memory the official emulator would swap less.',
  'The application’s start times include its own builds; the emulator-only starts and stops are the ones that isolate the emulators.',
  'One browser journey of the application waits on its cache worker, which the official emulator wakes early by notifying a listener for a document the listener’s filter excludes; Firenook does not, so that journey runs longer on Firenook. It is not an emulator latency and is left out.',
] as const;
