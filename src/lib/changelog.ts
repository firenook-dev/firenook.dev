// Every release, from the engine's changelog (src/data/engine/CHANGELOG.md):
// its version, its date on npm, its title, and its items sorted by what they
// are to a user. The bold-led items are the changes a user notices; the rest
// say what happens to saved data, or how the release was built and checked.

import changelog from '../data/engine/CHANGELOG.md?raw';
import type { Panel } from './panels';

/** When each version reached npm (`npm view firenook time`; the 0.1 line was @fireside-dev/cli). */
const published: Record<string, string> = {
  '0.2.0': '2026-10-23T11:10:45Z',
  '0.2.0-next.8': '2026-10-21T13:20:31Z',
  '0.2.0-next.7': '2026-10-20T18:56:32Z',
  '0.2.0-next.6': '2026-10-18T12:39:19Z',
  '0.2.0-next.5': '2026-10-17T17:45:59Z',
  '0.2.0-next.4': '2026-10-17T13:58:57Z',
  '0.2.0-next.3': '2026-10-17T13:06:26Z',
  '0.2.0-next.2': '2026-10-03T13:06:53Z',
  '0.2.0-next.1': '2026-09-19T15:04:20Z',
  '0.1.0-next.9': '2026-09-19T12:08:25Z',
  '0.1.0-next.8': '2026-09-18T17:41:24Z',
  '0.1.0-next.7': '2026-09-18T09:40:24Z',
  '0.1.0-next.6': '2026-09-16T18:30:53Z',
  '0.1.0-next.5': '2026-09-12T05:47:01Z',
  '0.1.0-next.4': '2026-09-11T12:57:23Z',
  '0.1.0-next.3': '2026-09-09T10:48:53Z',
  '0.1.0-next.2': '2026-09-09T04:13:38Z',
  '0.1.0-next.1': '2026-09-08T10:04:47Z',
  '0.1.0-next.0': '2026-09-07T18:35:31Z',
};

/** Releases cut before the release tags began have their notes in the changelog only. */
const tagged = (version: string) => !['0.1.0-next.0', '0.1.0-next.1', '0.1.0-next.2'].includes(version);

/**
 * What a release made faster, measured when it shipped on the same data
 * before and after, in the words of its notes (the 0.2.0 rows are from its
 * benchmark record). Lower is better on every row.
 */
export interface Measured {
  version: string;
  label: string;
  before: number;
  after: number;
  unit: string;
  /** Each side as the notes write it. */
  text: [before: string, after: string];
  /** The multiple, rounded down. */
  claim: string;
}

export const measured: Measured[] = [
  {
    version: '0.2.0',
    label: 'orderBy a timestamp, limit 20, on 2.7 million documents',
    before: 5128,
    after: 4.3,
    unit: 'ms',
    text: ['5,128 ms', '4.3 ms'],
    claim: '1,192× faster',
  },
  {
    version: '0.2.0',
    label: 'orderBy an integer field, limit 20',
    before: 177,
    after: 12.0,
    unit: 'ms',
    text: ['177 ms', '12.0 ms'],
    claim: '14× faster',
  },
  {
    version: '0.2.0-next.8',
    label: 'The console’s Firestore tree, first map of 2.7 million documents',
    before: 133,
    after: 37,
    unit: 's',
    text: ['133 s', '37 s'],
    claim: '3× faster',
  },
  {
    version: '0.2.0-next.7',
    label: 'Ready, with seven functions and every emulator',
    before: 6.82,
    after: 0.78,
    unit: 's',
    text: ['6.82 s', '0.78 s'],
    claim: '8× sooner',
  },
  {
    version: '0.2.0-next.6',
    label: 'Opening saved data, 2.7 million documents',
    before: 146000,
    after: 67,
    unit: 'ms',
    text: ['146 s', '67 ms'],
    claim: '2,179× sooner',
  },
  {
    version: '0.2.0-next.5',
    label: 'Checking a 7.8 GB seed before a resumed start',
    before: 26,
    after: 1,
    unit: 's',
    text: ['23–26 s', 'under 1 s'],
    claim: '23× sooner, at least',
  },
  {
    version: '0.1.0-next.6',
    label: 'A write, on a Mac',
    before: 13.1,
    after: 0.59,
    unit: 'ms',
    text: ['13.1 ms', '0.59 ms'],
    claim: '22× faster',
  },
];

export interface Item {
  /** The bold lead, when the item has one, as HTML without its full stop. */
  lead?: string;
  /** The item as HTML: code, bold and links kept. */
  html: string;
  /** The item without the bold lead, as HTML. */
  rest: string;
}

export interface Release {
  version: string;
  /** The title as a sentence: "The first release for public use". */
  title: string;
  date: Date;
  /** The release on GitHub, or the changelog for releases before the tags. */
  url: string;
  /** The release's own page on this site. */
  path: string;
  /** The release before it, if any. */
  previous?: string;
  stable: boolean;
  /** 0.2 is Firenook; the 0.1 previews were published as @fireside-dev/cli. */
  line: '0.2' | '0.1';
  /** The name it was published under. */
  name: 'Firenook' | 'Fireside';
  install: string;
  /** The changes a user notices: the bold-led items. */
  highlights: Item[];
  /** The other changes, for releases whose notes lead with no bold. */
  changes: Item[];
  /** What happens to saved data, ports and protocols. */
  data: Item[];
  /** How the release was built, checked, measured and published. */
  checks: Item[];
  /** What the release was known not to do yet. */
  limits: Item[];
  measured: Measured[];
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The repository's links from before the move to firenook-dev, which GitHub redirects. */
const moved = (url: string) => url.replace('https://github.com/sanjevirau/fireside/', 'https://github.com/firenook-dev/firenook/');

/** The little Markdown the changelog uses inside an item: code, bold and links. */
function inline(markdown: string): string {
  return escape(markdown)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_, text, url) => `<a href="${moved(url)}">${text}</a>`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1');
}

const check = /^(Pin the engine|Pinned|A consumer'?s gates|Checked against|Published straight|\[Benchmarked\]|Measured in|Dependencies:|Recaptured|No dependency)/;
const limit = /^(Limitations recorded|Known limitations|Left for)/;
const data = /^(Data |No emulator)/;

function item(markdown: string): Item {
  const lead = markdown.match(/^\*\*(.+?)\*\*/)?.[1];
  return {
    lead: lead && inline(lead.replace(/\.$/, '')),
    html: inline(markdown),
    rest: inline(lead ? markdown.slice(lead.length + 4).trim() : markdown),
  };
}

/** HTML as plain text, for descriptions and feeds. */
export const plain = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** An item's first sentence, for a list that has room for a line or two. */
export const firstSentence = (html: string) => html.match(/^.*?\.(?=\s+[A-Z(`<]|$)/)?.[0] ?? html;

function parse(): Release[] {
  return changelog
    .split(/^# /m)
    .slice(1)
    .map((section) => {
      const [heading, ...body] = section.split('\n');
      const [name, ...rest] = heading.split(' — ');
      const version = name.trim();
      const date = published[version];
      if (!date) throw new Error(`no publish date for ${version} in src/lib/changelog.ts`);
      // An item runs from "- " to the next item, its lines joined.
      const items = body
        .join('\n')
        .split(/^- /m)
        .slice(1)
        .map((text) => text.replace(/\s*\n\s*/g, ' ').trim());
      const title = rest.join(' — ').trim();
      const line = version.startsWith('0.1.') ? '0.1' : '0.2';
      return {
        version,
        title: title.charAt(0).toUpperCase() + title.slice(1),
        date: new Date(date),
        url: tagged(version)
          ? `https://github.com/firenook-dev/firenook/releases/tag/npm-v${version}`
          : 'https://github.com/firenook-dev/firenook/blob/main/packaging/CHANGELOG.md',
        path: `/changelog/${version}`,
        stable: !version.includes('-'),
        line,
        name: line === '0.1' ? 'Fireside' : 'Firenook',
        install: `npm install --save-dev --save-exact ${line === '0.1' ? '@fireside-dev/cli' : 'firenook'}@${version}`,
        highlights: items.filter((text) => text.startsWith('**')).map(item),
        changes: items
          .filter((text) => !text.startsWith('**') && !check.test(text) && !data.test(text) && !limit.test(text))
          .map(item),
        data: items.filter((text) => data.test(text)).map(item),
        checks: items.filter((text) => check.test(text)).map(item),
        limits: items.filter((text) => limit.test(text)).map(item),
        measured: measured.filter((row) => row.version === version),
      } satisfies Release;
    });
}

export const releases: Release[] = parse().map((release, index, all) => ({
  ...release,
  previous: all[index + 1]?.version,
}));
export const latest = releases[0];

/** A release's measures as panels: the release before it in grey, the release lit. */
export const panels = (rows: Measured[]): Panel[] =>
  rows.map((row) => {
    const release = releases.find((candidate) => candidate.version === row.version);
    const previous = release?.previous ?? 'Before';
    return {
      label: row.label,
      claim: row.claim,
      rows: [
        { who: previous, href: `/changelog/${previous}`, text: row.text[0], share: 1 },
        { who: row.version, href: `/changelog/${row.version}`, text: row.text[1], share: row.after / row.before },
      ],
    };
  });
