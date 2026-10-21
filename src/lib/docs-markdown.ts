// The docs as plain Markdown, for language models and anyone who would rather
// read the source: each page at its address plus .md, and all of them
// together in llms-full.txt.

import type { CollectionEntry } from 'astro:content';
import { site } from './site';

type Entry = CollectionEntry<'docs'>;

const attribute = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

/** A page's Markdown, with MDX's components written out as plain Markdown. */
export function pageMarkdown(entry: Entry): string {
  let body = entry.body ?? '';
  if (entry.filePath?.endsWith('.mdx')) {
    body = body
      .replace(/^import .*$/gm, '')
      .replace(/<LinkCard\b[\s\S]*?\/>/g, (tag) => {
        const description = attribute(tag, 'description');
        return `- [${attribute(tag, 'title')}](${attribute(tag, 'href')})${description ? `: ${description}` : ''}`;
      })
      .replace(/<TabItem\b[^>]*>/g, (tag) => `**${attribute(tag, 'label')}**\n`)
      // What is left is layout: grids, steps, tabs.
      .replace(/^\s*<\/?[A-Z][A-Za-z]*\b[^>]*>\s*$/gm, '');
  }
  body = body
    // Asides, as GitHub writes them.
    .replace(/^:::(note|tip|caution|danger)(?:\[([^\]]*)\])?\n([\s\S]*?)^:::$/gm, (_, kind: string, title: string | undefined, text: string) => {
      const label = title || { note: 'Note', tip: 'Tip', caution: 'Caution', danger: 'Danger' }[kind];
      return [`**${label}**`, '', ...text.trim().split('\n')].map((line) => (line ? `> ${line}` : '>')).join('\n');
    })
    // Code blocks lose Expressive Code's options.
    .replace(/^```(\w+)[^\n]*$/gm, '```$1')
    // Links between pages, in full.
    .replace(/\]\((\/[^)\s]*)\)/g, (_, path: string) => `](${site.url}${path})`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return `# ${entry.data.title}\n\n> ${entry.data.description}\n\n${body}\n`;
}
