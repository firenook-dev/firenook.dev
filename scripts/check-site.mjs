// Checks the built site in dist/: every internal link and anchor leads
// somewhere, every page has one title and a description of 160 characters
// or fewer, titles are unique, and every page's link preview exists. For
// agents: every page has its Markdown, every result the docs' MCP server can
// give leads to a page and heading, and the skill matches its digest.
//
//   npm run build && node scripts/check-site.mjs

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const site = 'https://firenook.dev';

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(dist);
const pages = files.filter((file) => file.endsWith('.html'));

/** The file a site path is served from, as the host serves it. */
function target(path) {
  const clean = decodeURIComponent(path.replace(/[?#].*$/, ''));
  const candidates = clean === '/' ? ['index.html'] : [clean.slice(1), `${clean.slice(1)}.html`, `${clean.slice(1)}/index.html`];
  return candidates.map((candidate) => join(dist, candidate)).find((file) => existsSync(file) && statSync(file).isFile());
}

const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) ids.set(file, new Set([...readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])));
  return ids.get(file);
};

const problems = [];
const titles = new Map();
let links = 0;

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const page = `/${relative(dist, file).replace(/\.html$/, '').replace(/(^|\/)index$/, '')}`;
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  const noindex = html.includes('name="robots" content="noindex"');
  if (!title) problems.push(`${page}: no title`);
  else if (!noindex) titles.set(title, [...(titles.get(title) ?? []), page]);
  if (!description) problems.push(`${page}: no description`);
  else if (description.replace(/&#39;|&amp;|&quot;|&lt;|&gt;/g, 'x').length > 160) problems.push(`${page}: description of ${description.length} characters`);
  const image = html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
  if (!image) problems.push(`${page}: no link preview`);
  else if (image.startsWith(site) && !target(image.slice(site.length))) problems.push(`${page}: link preview ${image} missing`);

  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    let href = match[1].replace(/&amp;/g, '&');
    if (href.startsWith(site)) href = href.slice(site.length) || '/';
    if (!href.startsWith('/') && !href.startsWith('#')) continue;
    if (href.startsWith('//')) continue;
    links++;
    const [path, anchor] = href.startsWith('#') ? [page, href.slice(1)] : href.split('#');
    const file2 = target(path || page);
    if (!file2) {
      problems.push(`${page}: broken link ${href}`);
      continue;
    }
    if (anchor && file2.endsWith('.html') && !idsOf(file2).has(decodeURIComponent(anchor))) problems.push(`${page}: missing anchor ${href}`);
  }
}

for (const [title, where] of titles) if (where.length > 1) problems.push(`title "${title}" on ${where.join(', ')}`);

for (const file of pages) {
  if (!file.endsWith('/404.html') && !existsSync(file.replace(/\.html$/, '.md'))) problems.push(`/${relative(dist, file)}: no Markdown`);
}
const index = JSON.parse(readFileSync(join(dist, 'docs/mcp/search.json'), 'utf8'));
for (const section of index.flatMap((page) => page.sections)) {
  const [path, anchor] = section.url.slice(site.length).split('#');
  const file = target(path || '/');
  if (!file) problems.push(`docs search: no page for ${section.url}`);
  else if (anchor && !idsOf(file).has(anchor)) problems.push(`docs search: missing anchor ${section.url}`);
}
for (const skill of JSON.parse(readFileSync(join(dist, '.well-known/agent-skills/index.json'), 'utf8')).skills) {
  const digest = `sha256:${createHash('sha256').update(readFileSync(join(dist, skill.url))).digest('hex')}`;
  if (digest !== skill.digest) problems.push(`skill ${skill.name}: digest ${skill.digest}, served file ${digest}`);
}

console.log(`${pages.length} pages, ${links} internal links checked`);
if (problems.length) {
  console.log([...new Set(problems)].join('\n'));
  process.exit(1);
}
console.log('no problems');
