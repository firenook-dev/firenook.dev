// The image a link to a page shows in chats and on social sites, 1200 × 630,
// drawn when the site is built: the night, the warm light, the logo, the
// page's title and what it is about.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const file = (path: string) => readFileSync(join(root, path));
const fonts = [
  { name: 'Figtree', data: file('node_modules/@fontsource/figtree/files/figtree-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  { name: 'Figtree', data: file('node_modules/@fontsource/figtree/files/figtree-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
];
const logo = `data:image/svg+xml;base64,${file('src/assets/brand/firenook-logo-flat-on-dark.svg').toString('base64')}`;

// Satori lays out with flexbox only, so every box is a flex box.
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});

export interface Card {
  title: string;
  subtitle: string;
  /** After the logo, such as "Docs". */
  section?: string;
}

/** Draws a page's link preview as a PNG response. */
/** At most about two lines, cut at a word. */
function short(text: string, limit = 118) {
  if (text.length <= limit) return text;
  return `${text.slice(0, text.lastIndexOf(' ', limit)).replace(/[,.;:]$/, '')}…`;
}

export async function drawCard({ title, subtitle, section }: Card): Promise<Response> {
  const titleSize = title.length > 52 ? 52 : title.length > 34 ? 60 : 70;
  const svg = await satori(
    h(
      'div',
      {
        width: 1200,
        height: 630,
        backgroundColor: '#141416',
        backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 112%, rgba(242,56,24,0.5), rgba(255,152,0,0.16) 55%, rgba(20,20,22,0) 100%)',
        color: '#f4f2ee',
        fontFamily: 'Figtree',
        padding: '64px 72px',
        boxSizing: 'border-box',
      },
      h(
        'div',
        { flex: 1, flexDirection: 'column', justifyContent: 'space-between' },
        h(
          'div',
          { alignItems: 'center', gap: 22 },
          { type: 'img', props: { src: logo, height: 54, width: 163 } },
          ...(section ? [h('div', { fontSize: 32, fontWeight: 500, color: '#8c8a92', marginTop: 4 }, section)] : []),
        ),
        h(
          'div',
          { flexDirection: 'column', gap: 24, maxWidth: 980 },
          h('div', { fontSize: titleSize, fontWeight: 700, letterSpacing: -2.4, lineHeight: 1.04 }, title),
          h('div', { fontSize: 29, fontWeight: 500, lineHeight: 1.35, color: '#a9a7ae' }, short(subtitle)),
        ),
      ),
    ) as never,
    { width: 1200, height: 630, fonts },
  );
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
