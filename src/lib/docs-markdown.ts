// The docs as plain Markdown, for language models and anyone who would rather
// read the source: each page at its address plus .md, and all of them
// together in llms-full.txt.

import type { CollectionEntry } from 'astro:content';
import { site } from './site';
import mcpTools from '../data/mcp-tools.json';

type Entry = CollectionEntry<'docs'>;

const attribute = (tag: string, name: string) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

interface ToolSchema {
  type?: string | string[];
  description?: string;
  properties?: Record<string, ToolSchema>;
  required?: string[];
}

// The groups the MCP tools reference page draws with <McpTools group="…" />
// (src/components/docs/McpTools.astro), written out as a list.
const toolGroup = (name: string) =>
  name === 'firenook_status' || name === 'emulators_export' ? 'status' : name === 'emulators_clear' ? 'reset' : name.split('_')[0];

function toolList(group: string): string {
  return (mcpTools.tools as unknown as { name: string; description: string; input: ToolSchema }[])
    .filter((tool) => toolGroup(tool.name) === group)
    .map((tool) => {
      const required = new Set(tool.input.required ?? []);
      const params = Object.entries(tool.input.properties ?? {}).map(
        ([name, schema]) =>
          `  - \`${name}\`${required.has(name) ? ' (required)' : ''}${schema.type ? `, ${[schema.type].flat().join(' | ')}` : ''}${schema.description ? `: ${schema.description}` : ''}`,
      );
      return [`- \`${tool.name}\`: ${tool.description}`, ...params].join('\n');
    })
    .join('\n');
}

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
      .replace(/<McpTools\b[^>]*\/>/g, (tag) => toolList(attribute(tag, 'group') ?? ''))
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
