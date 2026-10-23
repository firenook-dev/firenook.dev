// What the build writes for AI tools once the pages are built: each of the
// site's own pages as Markdown (page-markdown.mjs), and the search index the
// docs' MCP server reads (src/worker.ts). The index sits under /docs/mcp,
// where only the Worker answers, so it is read but never served.

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import GithubSlugger from 'github-slugger';
import { writePageMarkdown } from './page-markdown.mjs';

const site = 'https://firenook.dev';

async function files(dir, extension) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .sort();
}

/**
 * A heading's words, as a docs page's anchor is made from them: outside
 * code, the docs turn -- into a dash (smartypants), which the slug drops.
 */
const plain = (heading) =>
  heading
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .split('`')
    .map((part, index) => (index % 2 ? part : part.replace(/---/g, '—').replace(/--/g, '–').replace(/[*_]/g, '')))
    .join('')
    .trim();

/** A page's Markdown cut at its ## and ### headings. */
function sections(markdown, url, anchors) {
  const slugger = new GithubSlugger();
  const lines = markdown.split('\n');
  const title = lines[0].replace(/^# /, '');
  const found = [{ heading: title, url, lines: [] }];
  let fenced = false;
  for (const line of lines.slice(1)) {
    if (/^(```|~~~)/.test(line)) fenced = !fenced;
    const heading = !fenced && line.match(/^#{2,3} (.+)$/);
    if (heading) {
      const words = plain(heading[1]);
      found.push({ heading: words, url: anchors ? `${url}#${slugger.slug(words)}` : url, lines: [] });
    } else found.at(-1).lines.push(line);
  }
  return {
    url,
    title,
    sections: found
      .map(({ heading, url, lines }) => ({ heading, url, text: lines.join('\n').trim() }))
      .filter((section) => section.text),
  };
}

export function agentFiles() {
  return {
    name: 'firenook:agent-files',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = dir.pathname;
        const html = await files(root, '.html');
        // The docs' Markdown comes from their source; the not-found page has none.
        const own = html.filter((file) => file !== '404.html' && file !== 'docs.html' && !file.startsWith('docs/'));
        await writePageMarkdown(dir, own);

        const pages = [];
        // The pages, not the files for agents themselves (auth.md, the skill).
        const markdown = (await files(root, '.md')).filter((file) => file !== 'auth.md' && !file.startsWith('.well-known/'));
        for (const file of markdown) {
          const path = `/${file.replace(/\.md$/, '')}`.replace(/^\/index$/, '/');
          const url = path === '/' ? `${site}/` : `${site}${path}`;
          // Docs headings are anchors (Starlight's slugs); the site's own pages link whole.
          const docs = path === '/docs' || path.startsWith('/docs/');
          pages.push(sections(await readFile(new URL(file, dir), 'utf8'), url, docs));
        }
        await mkdir(new URL('docs/mcp/', dir), { recursive: true });
        await writeFile(new URL('docs/mcp/search.json', dir), JSON.stringify(pages));
        logger.info(`${own.length} pages as Markdown; ${pages.length} pages in the docs search index`);
      },
    },
  };
}
