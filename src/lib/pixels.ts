// The site's blocks (DESIGN.md). Each picture is drawn as rows of characters
// on a square grid:
//   f, a   the flame's two colours, as Firenook's terminal draws its mark
//   #      ink (the text colour of where it sits)
//   +      ink, dimmed
//   *      lit: flame to amber across the picture
//   .      empty

export const art = {
  // The mark as the terminal draws it, from half blocks: ▄█ ▄███▀ ▄ …
  flame: [
    '......f...',
    '.....ff...',
    '...ffff...',
    '..ffff..a.',
    '.ffff.aaa.',
    'ffff..aaaa',
    'ffff.aaaa.',
    '.ff..aaa..',
    '....aaa...',
    '....a.....',
  ],
  // A page of a database.
  firestore: [
    '.#####....',
    '.######...',
    '.#######..',
    '.########.',
    '.#******#.',
    '.########.',
    '.#******#.',
    '.########.',
    '.#****###.',
    '.########.',
  ],
  // A padlock: who is signed in.
  auth: [
    '...####...',
    '..##..##..',
    '..#....#..',
    '..#....#..',
    '##########',
    '##########',
    '####**####',
    '####**####',
    '##########',
    '##########',
  ],
  // A box of files.
  storage: [
    '##########',
    '##########',
    '..........',
    '.########.',
    '.##****##.',
    '.########.',
    '.########.',
    '.########.',
    '.########.',
    '.########.',
  ],
  // Code that runs.
  functions: [
    '##########',
    '#++++++++#',
    '#+#++++++#',
    '#++#+++++#',
    '#+++#++++#',
    '#++#+++++#',
    '#+#++***+#',
    '#++++++++#',
    '#++++++++#',
    '##########',
  ],
  // One message, to every subscriber.
  pubsub: [
    '......####',
    '......####',
    '.....#....',
    '****#.....',
    '****######',
    '****#.....',
    '.....#....',
    '......####',
    '......####',
    '..........',
  ],
  // A queue, the next task running.
  tasks: [
    '***.******',
    '***.******',
    '..........',
    '..........',
    '###.######',
    '###.######',
    '..........',
    '..........',
    '+++.++++++',
    '+++.++++++',
  ],
  // An event.
  eventarc: [
    '.....####.',
    '....####..',
    '...####...',
    '..####....',
    '.********.',
    '....####..',
    '...####...',
    '..####....',
    '.###......',
    '##........',
  ],
  // A piece that fits.
  extensions: [
    '..****....',
    '..****....',
    '########..',
    '########..',
    '##########',
    '##########',
    '##########',
    '##########',
    '########..',
    '########..',
  ],
} as const;

export type ArtName = keyof typeof art;

const flame = [0xf2, 0x38, 0x18];
const amber = [0xff, 0x98, 0x00];
const mix = (t: number) =>
  `#${flame.map((from, i) => Math.round(from + (amber[i] - from) * t).toString(16).padStart(2, '0')).join('')}`;

export interface Cell {
  x: number;
  y: number;
  fill: string;
  opacity?: number;
}

/** The cells of a picture, with their colours. */
export function cells(name: ArtName): { width: number; height: number; cells: Cell[] } {
  const rows = art[name];
  const height = rows.length;
  const width = Math.max(...rows.map((row) => row.length));
  const out: Cell[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === 'f') out.push({ x, y, fill: '#f23818' });
      else if (char === 'a') out.push({ x, y, fill: '#ff9800' });
      else if (char === '#') out.push({ x, y, fill: 'currentColor' });
      else if (char === '+') out.push({ x, y, fill: 'currentColor', opacity: 0.35 });
      else if (char === '*') out.push({ x, y, fill: mix((x + y) / (width + height - 2)) });
    });
  });
  return { width, height, cells: out };
}

const trim = (value: number) => Number(value.toFixed(3)).toString();

/**
 * Cells as SVG paths, one a colour: far fewer bytes than a rect a cell. Each
 * cell is a square of `size` at its place plus `inset`.
 */
export function paths(list: Cell[], size: number, inset = 0): { fill: string; opacity?: number; d: string }[] {
  const groups = new Map<string, { fill: string; opacity?: number; d: string[] }>();
  const side = trim(size);
  for (const c of list) {
    const key = `${c.fill}|${c.opacity ?? ''}`;
    let group = groups.get(key);
    if (!group) groups.set(key, (group = { fill: c.fill, opacity: c.opacity, d: [] }));
    group.d.push(`M${trim(c.x + inset)} ${trim(c.y + inset)}h${side}v${side}h-${side}z`);
  }
  return [...groups.values()].map((group) => ({ fill: group.fill, opacity: group.opacity, d: group.d.join('') }));
}

/** A small random number generator, so the embers are the same on every build. */
export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { mix as flameAt };
