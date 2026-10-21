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
