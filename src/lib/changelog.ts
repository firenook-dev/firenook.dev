// Every release, from the engine's changelog (src/data/engine/CHANGELOG.md):
// its version, its date on npm, its title, and the changes it leads with.
// The changelog's bold-led items are what a user notices; the rest records
// how the release was built and checked, and stays on GitHub.

import changelog from '../data/engine/CHANGELOG.md?raw';

/** When each version reached npm (`npm view firenook time`; the 0.1 line was @fireside-dev/cli). */
const published: Record<string, string> = {
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

export interface Release {
  version: string;
  title: string;
  date: Date;
  url: string;
  /** The bold-led changes, as HTML: the lead in <strong>, code and links kept. */
  highlights: { lead: string; html: string }[];
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The little Markdown the changelog uses inside an item: code, bold and links. */
function inline(markdown: string): string {
  return escape(markdown)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1');
}

function parse(): Release[] {
  return changelog
    .split(/^# /m)
    .slice(1)
    .map((section) => {
      const [heading, ...body] = section.split('\n');
      const [version, ...rest] = heading.split(' — ');
      const date = published[version.trim()];
      if (!date) throw new Error(`no publish date for ${version} in src/lib/changelog.ts`);
      // An item runs from "- " to the next item, its lines joined.
      const items = body
        .join('\n')
        .split(/^- /m)
        .slice(1)
        .map((item) => item.replace(/\s*\n\s*/g, ' ').trim());
      const highlights = items
        .filter((item) => item.startsWith('**'))
        .map((item) => {
          const lead = item.match(/^\*\*([^*]+)\*\*/)?.[1] ?? '';
          return { lead, html: inline(item) };
        });
      const v = version.trim();
      return {
        version: v,
        title: rest.join(' — ').trim(),
        date: new Date(date),
        url: tagged(v)
          ? `https://github.com/firenook-dev/firenook/releases/tag/npm-v${v}`
          : `https://github.com/firenook-dev/firenook/blob/main/packaging/CHANGELOG.md`,
        highlights,
      };
    });
}

export const releases: Release[] = parse();
