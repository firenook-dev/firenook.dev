// llms.txt and llms-full.txt (https://llmstxt.org): what is on firenook.dev,
// for language models, and the docs in full.

import { getCollection } from 'astro:content';
import { site, services, notEmulated } from './site';
import { sidebarPages } from './docs-sidebar.mjs';
import { pageMarkdown } from './docs-markdown';

const summary =
  'Firenook is a drop-in replacement for the Firebase Local Emulator Suite. It reads firebase.json, .firebaserc, rules and indexes the way the Firebase CLI does, serves ' +
  services.map((service) => service.name).join(', ') +
  ' on the official ports, and imports and exports the official format. It is one npm package with a native engine for macOS, Linux and Windows: no Java, nothing else downloaded. It does not emulate ' +
  notEmulated.join(', ') +
  '. Open source under the Apache License 2.0, in preview (0.2.0-next releases).';

async function docs() {
  const entries = await getCollection('docs');
  const byPath = new Map(entries.map((entry) => [`/${entry.id}`, entry]));
  return sidebarPages()
    .filter((page) => byPath.has(page.link))
    .map((page) => ({ ...page, entry: byPath.get(page.link)! }));
}

export async function llmsIndex(): Promise<string> {
  const lines = [
    `# ${site.name}`,
    '',
    `> ${summary}`,
    '',
    'Each docs page is also Markdown, at its address plus .md. All of the docs together are in [llms-full.txt](https://firenook.dev/llms-full.txt).',
    '',
    '## Website',
    '',
    `- [Home](${site.url}/): what Firenook is, the one-word switch, measured results, the console, MCP and the services.`,
    '',
  ];
  let heading = '';
  for (const page of await docs()) {
    const group = page.groups.join(': ') || 'Docs';
    if (group !== heading) {
      lines.push(`## ${group}`, '');
      heading = group;
    }
    lines.push(`- [${page.entry.data.title}](${site.url}/${page.entry.id}.md): ${page.entry.data.description}`);
  }
  lines.push('', '## Source', '', `- [Firenook on GitHub](${site.repo})`, `- [firenook on npm](${site.npm})`, '');
  return lines.join('\n');
}

export async function llmsFull(): Promise<string> {
  const pages = await docs();
  return [`# ${site.name} docs`, '', `> ${summary}`, '', ...pages.map((page) => pageMarkdown(page.entry))].join('\n');
}
