// The embers: the bed of lit blocks the terminal and the closing sit on
// (DESIGN.md), as a picture of time. Heat rises through a bed that is hottest
// at the bottom middle, and each cell lights when the heat passing through it
// crosses that cell's own threshold, so light climbs in shapes rather than
// twinkling at random; now and then a spark leaves the bed. The page draws it
// live and scripts/embers renders it for the brand's posts. It repeats every
// PERIOD seconds, so a render loops without a seam, and the page's still
// frame (without JavaScript, or with reduced motion) is the time 0.
//
// No imports, so Node can run it as it is.

export const PERIOD = 8;

/** Rows the heat climbs in a second. */
const RISE = 3;
/** Sparks that leave the bed in a period. */
const SPARKS = 9;

const FLAME = [0xf2, 0x38, 0x18];
const AMBER = [0xff, 0x98, 0x00];

export interface Ember {
  x: number;
  y: number;
  fill: string;
  rgb: readonly number[];
  opacity: number;
}

/** A number in [0, 1) for each set of integers, the same every time. */
function hash(a: number, b: number, c: number, d = 0): number {
  let h = Math.imul(a ^ 0x5bd1e995, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1) ^ Math.imul(c, 0x9e3779b1) ^ Math.imul(d, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth noise on a lattice that repeats every `wrap` steps down. */
function noise(seed: number, x: number, y: number, wrap: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const sx = (x - ix) * (x - ix) * (3 - 2 * (x - ix));
  const sy = (y - iy) * (y - iy) * (3 - 2 * (y - iy));
  const at = (i: number, j: number) => hash(seed, i, ((j % wrap) + wrap) % wrap);
  const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
  const bottom = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
  return top + (bottom - top) * sy;
}

const steps = (value: number, count: number) => Math.round(Math.min(1, Math.max(0, value)) * count) / count;

const colours = new Map<number, { fill: string; rgb: number[] }>();
function colour(t: number) {
  let found = colours.get(t);
  if (!found) {
    const rgb = FLAME.map((from, i) => Math.round(from + (AMBER[i] - from) * t));
    found = { rgb, fill: `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}` };
    colours.set(t, found);
  }
  return found;
}

/** The embers of a bed `columns` wide and `rows` high, as a function of time in seconds. */
export function embers(columns: number, rows: number, seed: number): (time: number) => Ember[] {
  const middle = (columns - 1) / 2;
  const bed: { x: number; y: number; base: number; threshold: number; jitter: number; tint: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const across = (x - middle) / middle;
      const up = (rows - 1 - y) / (rows - 1);
      const base = Math.exp(-across * across * 2.2) * Math.pow(1 - up, 1.7);
      if (base < 0.015) continue;
      bed.push({ x, y, base, threshold: hash(seed, x, y, 1), jitter: hash(seed, x, y, 2), tint: hash(seed, x, y, 3) });
    }
  }
  // The heat travels RISE * PERIOD rows in a period; the lattices wrap on it.
  const travel = RISE * PERIOD;

  return (time) => {
    const t = ((time % PERIOD) + PERIOD) % PERIOD;
    const phase = t / PERIOD;
    const sway = 0.5 * Math.sin(phase * 2 * Math.PI);
    const out: Ember[] = [];
    for (const cell of bed) {
      const n =
        0.65 * noise(seed + 11, cell.x / 6 + sway, (cell.y + phase * travel) / 3, travel / 3) +
        0.35 * noise(seed + 13, cell.x / 3 - sway, (cell.y + phase * travel) / 1.5, travel / 1.5);
      const heat = Math.min(1, cell.base * (0.35 + n * 1.1));
      if (cell.threshold > heat * 0.62) continue;
      const glow = Math.min(1, heat * (0.55 + cell.jitter * 0.7));
      // Amber where it is hottest, flame at the edges and the top.
      const { fill, rgb } = colour(steps(glow * 1.15 - 0.1 + (cell.tint - 0.5) * 0.3, 6));
      out.push({ x: cell.x, y: cell.y, fill, rgb, opacity: steps(0.18 + glow * 0.82, 8) });
    }

    // Sparks: one cell rising off the bed, cooling from amber to flame.
    const top = rows - 1 - Math.round(rows * 0.4);
    for (let k = 0; k < SPARKS; k++) {
      const born = ((k + hash(seed, k, 0, 4) * 0.8) * PERIOD) / SPARKS;
      const life = 1.4 + hash(seed, k, 0, 5);
      const age = t - born >= 0 ? t - born : t - born + PERIOD;
      if (age >= life) continue;
      const x = Math.round(middle + (hash(seed, k, 0, 6) - 0.5) * columns * 0.45 + Math.sin(age * 3 + k) * 0.8);
      const y = Math.round(top - age * RISE * 1.4);
      if (y < 0 || x < 0 || x >= columns) continue;
      const left = 1 - age / life;
      const { fill, rgb } = colour(steps(left, 6));
      out.push({ x, y, fill, rgb, opacity: steps(0.25 + left * 0.65, 8) });
    }
    return out;
  };
}
