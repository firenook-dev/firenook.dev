// The record behind /compatibility: every answer recorded from the official
// emulator or from production Firebase, which Firenook's replays check on
// every change. scripts/conformance/import.mjs writes the summary from the
// engine's record for a release; each block's own request and answer stay in
// public/conformance/<service>.json, fetched when someone points at it.

import summary from '../data/conformance/summary.json';

export type Kind = 'production' | 'official';

export interface RecordedSet {
  id: string;
  area: string;
  kind: Kind;
  reference: string;
  version: string | null;
  /** The reference and its version as one phrase. */
  label: string;
  recordedAt: string | null;
  scenarios: number;
  answers: number;
  /** What the replays proved: the same answer, a deliberate difference, not replayed yet. */
  checked: number;
  differs: number;
  unreplayed: number;
  /** The set's first block in its service's row. */
  start: number;
}

/** A block's state: checked (lit), a deliberate difference (outlined), not replayed yet (cold). */
export type State = 'c' | 'd' | 'u';

export interface ServiceRecord {
  id: string;
  name: string;
  art: string | null;
  anchor: string;
  answers: number;
  production: number;
  official: number;
  scenarios: number;
  checked: number;
  differs: number;
  unreplayed: number;
  checkedProduction: number;
  sets: RecordedSet[];
  /** The wall's runs, [first block, length, reference, state], in wall order. */
  spans: [number, number, Kind, State][];
  /** The sets' indexes in the order the page lists them: by what they cover. */
  listed: number[];
}

export interface ConformanceRecord {
  release: string | null;
  importedAt: string;
  total: number;
  production: number;
  official: number;
  scenarios: number;
  checked: number;
  differs: number;
  unreplayed: number;
  checkedProduction: number;
  services: ServiceRecord[];
}

export const record = summary as ConformanceRecord;

/** The wall's columns: a desktop row, and a phone's. */
export const COLUMNS = { wide: 124, narrow: 64 } as const;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The blocks start..start+length on a wall `columns` wide, as at most three
 * boxes in block units: the rest of the first row, the whole rows, and the
 * start of the last.
 */
export function boxes(start: number, length: number, columns: number): Box[] {
  if (length <= 0) return [];
  const end = start + length;
  const first = Math.floor(start / columns);
  const last = Math.floor((end - 1) / columns);
  const from = start % columns;
  const to = ((end - 1) % columns) + 1;
  if (first === last) return [{ x: from, y: first, w: to - from, h: 1 }];
  const out: Box[] = [{ x: from, y: first, w: columns - from, h: 1 }];
  if (last - first > 1) out.push({ x: 0, y: first + 1, w: columns, h: last - first - 1 });
  out.push({ x: 0, y: last, w: to, h: 1 });
  return out;
}

/** How many rows a service's blocks take on a wall `columns` wide. */
export const rows = (answers: number, columns: number) => Math.max(1, Math.ceil(answers / columns));

/** The wall's runs of one service: its sets' blocks by reference and state, in wall order. */
export function spans(service: ServiceRecord): { kind: Kind; state: State; start: number; length: number }[] {
  return service.spans.map(([start, length, kind, state]) => ({ kind, state, start, length }));
}

export const formatCount = (n: number) => n.toLocaleString('en-US');

/** "18 September 2026", for a recording's date. */
export function formatDay(day: string | null): string | null {
  if (!day) return null;
  const date = new Date(`${day}T00:00:00Z`);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Where an answer came from, in words: "Auth emulator (firebase-tools 15.22.0)". */
export const referenceLabel = (set: RecordedSet) => set.label;
