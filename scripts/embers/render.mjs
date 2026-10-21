// Renders the embers (src/lib/fire.ts, the same fire the home page draws) as
// a seamless loop for the brand's posts: an MP4, a GIF, or a still PNG.
//
//   node scripts/embers/render.mjs out/embers-1080x1080.mp4 --size 1080x1080
//   node scripts/embers/render.mjs out/embers-1200x630.gif --size 1200x630
//   node scripts/embers/render.mjs out/embers.png --size 1920x1080 --at 2.5
//
// Options: --size WxH (1080x1080), --columns N (cells across, 72),
// --rows N (bed height in cells, 18), --seed N (23), --fps N (24),
// --at seconds (for a PNG). Needs ffmpeg.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, extname } from 'node:path';
import { embers, PERIOD } from '../../src/lib/fire.ts';

const args = process.argv.slice(2);
const out = args.find((arg) => !arg.startsWith('--') && !/^\d/.test(arg));
const option = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : fallback;
};
if (!out) {
  console.error('usage: node scripts/embers/render.mjs <out.mp4|out.gif|out.png> [--size WxH] [--columns N] [--rows N]');
  process.exit(1);
}

const [width, height] = option('size', '1080x1080').split('x').map(Number);
const columns = Number(option('columns', 72));
const rows = Number(option('rows', 18));
const seed = Number(option('seed', 23));
const fps = Number(option('fps', 24));
const NIGHT = [0x14, 0x14, 0x16];

const frameAt = embers(columns, rows, seed);
// Square cells across the whole width, the bed on the bottom edge.
const pitch = width / columns;
const bedTop = height - pitch * rows;

/** One frame as RGBA bytes. */
function render(time) {
  const list = frameAt(time);
  const r = new Float32Array(width * height).fill(NIGHT[0]);
  const g = new Float32Array(width * height).fill(NIGHT[1]);
  const b = new Float32Array(width * height).fill(NIGHT[2]);

  // The glow: each cell's colour over its whole square, blurred wide.
  const gr = new Float32Array(width * height);
  const gg = new Float32Array(width * height);
  const gb = new Float32Array(width * height);
  const ga = new Float32Array(width * height);
  for (const e of list) fill(e, gr, gg, gb, ga, 0, pitch);
  const radius = Math.round(pitch * 1.6);
  for (const plane of [gr, gg, gb, ga]) blur(plane, radius);
  for (let i = 0; i < width * height; i++) {
    if (ga[i] <= 0) continue;
    const a = Math.min(1, ga[i]) * 0.85;
    const k = ga[i] > 0 ? 1 / ga[i] : 0;
    r[i] = r[i] * (1 - a) + gr[i] * k * a;
    g[i] = g[i] * (1 - a) + gg[i] * k * a;
    b[i] = b[i] * (1 - a) + gb[i] * k * a;
  }

  // The cells: four fifths of the pitch, snapped to whole pixels.
  for (const e of list) {
    const x0 = Math.round(e.x * pitch + pitch * 0.1);
    const x1 = Math.round(e.x * pitch + pitch * 0.9);
    const y0 = Math.round(bedTop + e.y * pitch + pitch * 0.1);
    const y1 = Math.round(bedTop + e.y * pitch + pitch * 0.9);
    for (let y = Math.max(0, y0); y < Math.min(height, y1); y++) {
      for (let x = Math.max(0, x0); x < Math.min(width, x1); x++) {
        const i = y * width + x;
        r[i] = r[i] * (1 - e.opacity) + e.rgb[0] * e.opacity;
        g[i] = g[i] * (1 - e.opacity) + e.rgb[1] * e.opacity;
        b[i] = b[i] * (1 - e.opacity) + e.rgb[2] * e.opacity;
      }
    }
  }

  // The bed fades out towards its top, as on the page.
  const bytes = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const into = (y - bedTop) / (pitch * rows);
    const keep = into >= 0.4 ? 1 : Math.max(0, into / 0.4);
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      bytes[i * 4] = NIGHT[0] + (r[i] - NIGHT[0]) * keep;
      bytes[i * 4 + 1] = NIGHT[1] + (g[i] - NIGHT[1]) * keep;
      bytes[i * 4 + 2] = NIGHT[2] + (b[i] - NIGHT[2]) * keep;
      bytes[i * 4 + 3] = 255;
    }
  }
  return bytes;
}

function fill(e, pr, pg, pb, pa, inset, size) {
  const x0 = Math.max(0, Math.round(e.x * pitch + inset));
  const x1 = Math.min(width, Math.round(e.x * pitch + inset + size));
  const y0 = Math.max(0, Math.round(bedTop + e.y * pitch + inset));
  const y1 = Math.min(height, Math.round(bedTop + e.y * pitch + inset + size));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * width + x;
      pr[i] += e.rgb[0] * e.opacity;
      pg[i] += e.rgb[1] * e.opacity;
      pb[i] += e.rgb[2] * e.opacity;
      pa[i] += e.opacity;
    }
  }
}

/** Three box blurs, close to a Gaussian. */
function blur(plane, radius) {
  const line = new Float32Array(Math.max(width, height));
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < height; y++) box(plane, y * width, 1, width, radius, line);
    for (let x = 0; x < width; x++) box(plane, x, width, height, radius, line);
  }
}

function box(plane, start, stride, length, radius, line) {
  let sum = 0;
  const span = radius * 2 + 1;
  for (let i = -radius; i <= radius; i++) sum += i >= 0 && i < length ? plane[start + i * stride] : 0;
  for (let i = 0; i < length; i++) {
    line[i] = sum / span;
    const leave = i - radius;
    const enter = i + radius + 1;
    if (leave >= 0) sum -= plane[start + leave * stride];
    if (enter < length) sum += plane[start + enter * stride];
  }
  for (let i = 0; i < length; i++) plane[start + i * stride] = line[i];
}

mkdirSync(dirname(out), { recursive: true });
const kind = extname(out).toLowerCase();
const input = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${width}x${height}`, '-r', String(fps), '-i', '-'];
const output = {
  '.png': ['-frames:v', '1', out],
  '.mp4': ['-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
  '.gif': ['-vf', 'split[a][b];[a]palettegen=max_colors=96:stats_mode=full[p];[b][p]paletteuse=dither=none', '-loop', '0', out],
}[kind];
if (!output) throw new Error(`write a .mp4, .gif or .png, not ${kind}`);

const ffmpeg = spawn('ffmpeg', [...input, ...output], { stdio: ['pipe', 'inherit', 'inherit'] });
const frames = kind === '.png' ? 1 : Math.round(PERIOD * fps);
const at = Number(option('at', 0));
for (let n = 0; n < frames; n++) {
  const ok = ffmpeg.stdin.write(render(kind === '.png' ? at : n / fps));
  if (!ok) await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
}
ffmpeg.stdin.end();
await new Promise((resolve, reject) => ffmpeg.on('close', (code) => (code ? reject(new Error(`ffmpeg exited ${code}`)) : resolve())));
console.log(`${out}: ${width}×${height}, ${frames} frame${frames > 1 ? 's' : ''}, loops every ${PERIOD} s`);
