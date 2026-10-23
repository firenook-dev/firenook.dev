// The site's own pages as Markdown, for AI tools: after the build, each
// page's <main> is written out next to it (benchmarks.html, benchmarks.md).
// The docs have their own Markdown, from their source (docs-markdown.ts).

import { readFile, writeFile } from 'node:fs/promises';
import { fromHtml } from 'hast-util-from-html';
import { selectAll, select } from 'hast-util-select';
import { toMdast } from 'hast-util-to-mdast';
import { toMarkdown } from 'mdast-util-to-markdown';
import { gfmToMarkdown } from 'mdast-util-gfm';

const site = 'https://firenook.dev';

/** What a reader of the text has no use for: pictures, controls, animation. */
const decoration = ['script', 'style', 'template', 'svg', 'canvas', 'button', 'nav', '[aria-hidden="true"]', '[hidden]'].join(',');

/** Inline elements whose text runs on into the next word, as in prose. */
const prose = new Set(['a', 'abbr', 'b', 'code', 'em', 'i', 'kbd', 'mark', 's', 'small', 'strong', 'sub', 'sup', 'u']);

const text = (value) => ({ type: 'text', value });

function remove(tree, selector) {
  const doomed = new Set(selectAll(selector, tree));
  const walk = (node) => {
    if (!node.children) return;
    node.children = node.children.filter((child) => !doomed.has(child));
    node.children.forEach(walk);
  };
  walk(tree);
}

/**
 * Laid out side by side, two spans read as two words (`orders` `12
 * documents`), but their text has nothing between it. Inside code, text is
 * kept as it is, and each line of a block ends with a line break.
 */
function space(node) {
  if (!node.children) return;
  if (node.tagName === 'pre') {
    // Lines drawn as blocks (`diff-line`, `run-line`) have no break of their own.
    const lines = selectAll('*', node).filter((line) => [line.properties.className ?? []].flat().some((name) => /(^|-)line$/.test(name)));
    for (const line of lines.slice(0, -1)) line.children.push(text('\n'));
    return;
  }
  if (node.tagName === 'code') return;
  const children = [];
  node.children.forEach((child, index) => {
    const previous = node.children[index - 1];
    if (previous?.type === 'element') {
      const glued =
        child.type === 'element' || (child.type === 'text' && /^[\p{L}\p{N}]/u.test(child.value) && !prose.has(previous.tagName));
      if (glued) children.push(text(' '));
    }
    children.push(child);
  });
  node.children = children;
  node.children.forEach(space);
}

/** Links and pictures in full, so the Markdown stands on its own. */
function absolute(tree, path) {
  for (const node of selectAll('a[href], img[src]', tree)) {
    const key = node.tagName === 'a' ? 'href' : 'src';
    const value = String(node.properties[key]);
    if (value.startsWith('/')) node.properties[key] = site + value;
    else if (value.startsWith('#')) node.properties[key] = site + path + value;
  }
}

/**
 * The address a built page is served at: dist/vs/x.html is /vs/x, and
 * dist/index.html is /.
 */
export const pagePath = (relative) => `/${relative.replace(/\.html$/, '').replace(/^index$/, '')}`;

/** A page's Markdown: its title and description, then its main content. */
export async function pageMarkdown(file, path) {
  const tree = fromHtml(await readFile(file, 'utf8'));
  const title = String(select('meta[property="og:title"]', tree)?.properties.content ?? '');
  const description = String(select('meta[name="description"]', tree)?.properties.content ?? '');
  const main = select('main', tree);
  if (!main) return null;
  // The title is the Markdown's own heading.
  remove(main, `${decoration}, h1`);
  // The demo's panels are pictures drawn in HTML; their label says what they show.
  for (const panel of selectAll('.mini[aria-label]', main)) {
    panel.tagName = 'p';
    panel.children = [{ type: 'element', tagName: 'em', properties: {}, children: [text(String(panel.properties.ariaLabel))] }];
  }
  space(main);
  absolute(main, path);
  const body = toMarkdown(toMdast(main), { extensions: [gfmToMarkdown()], bullet: '-', emphasis: '_', rule: '-' })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return `# ${title.replace(/ · Firenook$/, '')}\n\n> ${description}\n\n${body}\n`;
}

/** Writes each page's Markdown next to it. */
export async function writePageMarkdown(dir, relatives) {
  for (const relative of relatives) {
    const file = new URL(relative, dir);
    const markdown = await pageMarkdown(file, pagePath(relative));
    if (markdown) await writeFile(new URL(relative.replace(/\.html$/, '.md'), dir), markdown);
  }
}
