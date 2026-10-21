// The figures the site quotes from the benchmark of 0.2.0-next.6 against the
// official emulator (firebase-tools 15.22.0 on Java 26), measured on 18–19
// October 2026. The record is benchmarks/next6-paired-acceptance.json in the
// engine repository; the method is on /benchmarks.

export const benchmark = {
  release: '0.2.0-next.6',
  official: 'firebase-tools 15.22.0 on Java 26',
  measured: '18–19 October 2026',
  record: 'https://github.com/firenook-dev/firenook/blob/main/benchmarks/next6-paired-acceptance.json',
  machine: 'one AMD Ryzen 5 3600 server with 64 GiB',
  application: 'a real application with 211,205 Firestore documents and 6.7 GB in Storage',
  queryShapesOfficialWins: 6,
  queryShapes: 26,
} as const;

export interface Pair {
  label: string;
  unit: string;
  official: number;
  firenook: number;
  /** The comparison as the benchmark states it. */
  claim: string;
}

/** The rows of the published chart, in its order. Lower is better on every row. */
export const pairs: Pair[] = [
  { label: 'Memory at peak', unit: 'GiB', official: 19.6, firenook: 2.16, claim: '9× less' },
  { label: 'Write, median', unit: 'ms', official: 203, firenook: 5.3, claim: '38× faster' },
  { label: 'Listener update, median', unit: 'ms', official: 203, firenook: 11, claim: '18× faster' },
  { label: 'Restart with data kept', unit: 's', official: 21.6, firenook: 0.56, claim: '39× sooner' },
  { label: 'Restart, 2.5 million documents', unit: 's', official: 45.1, firenook: 0.56, claim: '80× sooner' },
  { label: 'CPU over two hours', unit: 's', official: 1597, firenook: 625, claim: '61% less' },
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
  { label: 'Write, acknowledged', official: [202.8, 267.3], firenook: [5.3, 53.7], faster: '38×' },
  { label: 'Listener update after a write', official: [203, 257], firenook: [11, 62], faster: '18×' },
  { label: 'Filtered query under load', official: [32.0, 43.7], firenook: [6.9, 27.2], faster: '4.6×' },
  { label: 'The same query from an idle client', official: [32.1, 40.7], firenook: [7.5, 29.8], faster: '4.3×' },
  { label: 'Firestore-triggered function', official: [3.75, 7.23], firenook: [3.06, 4.83], faster: '1.2×' },
  { label: 'Storage upload, metadata, download, delete', official: [11.7, 21.8], firenook: [8.6, 12.2], faster: '1.4×' },
] as const;

export const resources = [
  { label: 'Emulator memory, peak (PSS)', official: '19.56 GiB (Java)', firenook: '2.16 GiB' },
  { label: 'Emulator memory, first → last sample', official: '14.12 → 19.14 GiB', firenook: '1.77 → 1.83 GiB' },
  { label: 'Whole stack, peak (emulator and application)', official: '29.66 GiB', firenook: '11.09 GiB' },
  { label: 'Emulator CPU time', official: '1,597 s', firenook: '625 s' },
  { label: 'Disk written by the whole server', official: '1.24 GB', firenook: '1.97 GB' },
] as const;

/** Firestore, Auth and Storage with the same data, no application. */
export const restarts = [
  { label: 'First start, importing the data', official: '35.0 s', firenook: '18.3 s' },
  { label: 'Start again with the data', official: '21.6–23.6 s', firenook: '0.54–0.57 s' },
  { label: 'Stop with the data saved', official: '50–57 s (export)', firenook: '0.04–0.30 s' },
  { label: 'Memory once ready', official: '7.0 GiB', firenook: '0.15 GiB' },
] as const;

/** The same data grown by 2,500,000 small documents (a 7.46 GB store). */
export const grown = [
  { label: 'Firenook 0.2.0-next.6', ready: '0.56 s each time', memory: '0.15 GiB' },
  { label: 'Firenook 0.2.0-next.5', ready: '17.8 s, then 7.0 s', memory: '0.25 GiB' },
  { label: 'Official emulator', ready: '48.2 s, then 45.1 s', memory: '15.6 GiB' },
] as const;

/** 26 query shapes over gRPC, each warmed once then run 25 times. ms. */
export const queryShapes: { shape: string; official: [number, number]; firenook: [number, number]; winner: 'firenook' | 'official'; times: string }[] = [
  { shape: 'Document id in 10 ids', official: [574, 607], firenook: [22.0, 31.6], winner: 'firenook', times: '26.1×' },
  { shape: 'Collection, limit 1', official: [83.3, 90.8], firenook: [3.57, 6.57], winner: 'firenook', times: '23.3×' },
  { shape: 'count() of a collection', official: [85.3, 86.4], firenook: [5.05, 11.1], winner: 'firenook', times: '16.9×' },
  { shape: 'Small collection: == on a string', official: [27.2, 27.9], firenook: [1.85, 1.98], winner: 'firenook', times: '14.7×' },
  { shape: 'array-contains', official: [717, 733], firenook: [97.3, 109], winner: 'firenook', times: '7.4×' },
  { shape: '== on a boolean, limit 20', official: [105, 127], firenook: [18.9, 34.4], winner: 'firenook', times: '5.5×' },
  { shape: 'array-contains-any of 5 values', official: [354, 361], firenook: [75.8, 98.0], winner: 'firenook', times: '4.7×' },
  { shape: 'count() with == on a boolean', official: [82.4, 84.2], firenook: [19.3, 28.9], winner: 'firenook', times: '4.3×' },
  { shape: '== on a string field', official: [127, 149], firenook: [31.7, 41.6], winner: 'firenook', times: '4.0×' },
  { shape: 'offset 1000, limit 20', official: [101, 110], firenook: [29.1, 39.6], winner: 'firenook', times: '3.5×' },
  { shape: 'Collection group, limit 20', official: [56.5, 68.4], firenook: [18.4, 22.7], winner: 'firenook', times: '3.1×' },
  { shape: 'Second collection: array-contains plus orderBy a timestamp', official: [36.8, 47.0], firenook: [14.8, 23.5], winner: 'firenook', times: '2.5×' },
  { shape: 'Second collection: == on a boolean, limit 50', official: [118, 132], firenook: [53.5, 70.3], winner: 'firenook', times: '2.2×' },
  { shape: 'Listener: first snapshot of 20 documents', official: [115, 124], firenook: [54.4, 66.9], winner: 'firenook', times: '2.1×' },
  { shape: 'Collection, limit 100', official: [208, 242], firenook: [101, 126], winner: 'firenook', times: '2.1×' },
  { shape: 'Second collection: == plus !=', official: [59.9, 70.0], firenook: [33.0, 48.8], winner: 'firenook', times: '1.8×' },
  { shape: 'Get one document by id', official: [5.73, 7.12], firenook: [3.47, 4.97], winner: 'firenook', times: '1.7×' },
  { shape: 'Write one document, then delete it', official: [3.35, 5.02], firenook: [2.07, 3.28], winner: 'firenook', times: '1.6×' },
  { shape: 'Transaction: read, modify, write', official: [5.42, 6.3], firenook: [4.06, 6.07], winner: 'firenook', times: '1.3×' },
  { shape: 'Ids only, limit 500', official: [91.7, 111], firenook: [90.6, 119], winner: 'firenook', times: '1.0×' },
  { shape: '== plus orderBy on another field', official: [98.9, 111], firenook: [109, 134], winner: 'official', times: '1.1×' },
  { shape: 'Batch get of 50 documents', official: [72.8, 276], firenook: [130, 172], winner: 'official', times: '1.8×' },
  { shape: 'Range on an integer field, limit 20', official: [94.2, 103], firenook: [172, 209], winner: 'official', times: '1.8×' },
  { shape: 'Five cursor pages of 20', official: [480, 501], firenook: [888, 960], winner: 'official', times: '1.8×' },
  { shape: 'orderBy an integer field, limit 20', official: [94.4, 100], firenook: [178, 211], winner: 'official', times: '1.9×' },
  { shape: 'orderBy a timestamp, descending, limit 20', official: [96.0, 118], firenook: [201, 224], winner: 'official', times: '2.1×' },
];

/** 2,000 writes one at a time, each confirmed by a listener, then 4,000 from eight writers. */
export const writesAlone = [
  { round: 1, release: '0.2.0-next.5', write: '0.67 / 1.67 ms', listener: '0.75 ms', eight: '1,097 writes/s' },
  { round: 2, release: '0.2.0-next.6', write: '0.65 / 1.15 ms', listener: '0.71 ms', eight: '3,054 writes/s' },
  { round: 3, release: '0.2.0-next.5', write: '0.87 / 1.11 ms', listener: '0.95 ms', eight: '3,077 writes/s' },
  { round: 4, release: '0.2.0-next.6', write: '0.85 / 1.05 ms', listener: '0.94 ms', eight: '3,344 writes/s' },
] as const;

/** 0.2.0-next.7 checked against 0.2.0-next.6 on the same server, 20 October 2026. */
export const next7Check = {
  record: 'https://github.com/firenook-dev/firenook/blob/main/benchmarks/next7-regression.json',
  rows: [
    { label: 'First start, importing the data (4 each)', before: '21.4 s', after: '21.8 s' },
    { label: 'Start again with the data (3 each)', before: '0.56 s', after: '0.58 s' },
    { label: 'Memory once ready', before: '0.15 GiB', after: '0.16 GiB' },
    { label: 'Memory after the 26 query shapes', before: '0.24 GiB', after: '0.27 GiB' },
    { label: 'Write, median / p99 (5 rounds each)', before: '0.72 / 1.13 ms', after: '0.76 / 1.12 ms' },
    { label: 'Listener, median', before: '0.80 ms', after: '0.83 ms' },
    { label: 'Eight writers', before: '3,213 writes/s', after: '3,257 writes/s' },
    { label: 'A project with seven functions, ready (5 each)', before: '6.82 s', after: '0.78 s' },
  ],
} as const;

export const fairness = [
  'One emulator at a time on an otherwise idle server, from a clean start, swap emptied before each stack started.',
  'The official emulator ran with Java’s default settings, as a developer gets it. Firenook ran its defaults: data on disk, acknowledged writes durable within a second.',
  'Same data, same application revision, same workload; the run fails unless both stacks end with identical data.',
  'Every percentile is computed from all recorded operations, and an independent audit recomputed every figure from the raw samples and verified the 95 checksummed evidence files.',
  'The application’s own scheduled jobs were kept outside both measuring windows.',
] as const;

export const limits = [
  'One server and one application. Measure your own workload before relying on these numbers.',
  'The official stack put 4.8 GB into swap while starting and 0.8 GB more during its two hours; Firenook’s put 36 MB and none. The official medians match the September runs, where neither swapped.',
  'The application’s start times include its own builds and are similar on both; the emulator-only starts and stops are the ones that isolate the emulators.',
  'One browser journey of the application waits on its cache worker, which the official emulator wakes early by notifying a listener for a document the listener’s filter excludes; Firenook does not, so that journey runs longer on Firenook. It is not an emulator latency and is left out.',
] as const;
