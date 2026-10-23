// The one address on firenook.dev that runs code: /docs/mcp, an MCP server
// over the docs (Streamable HTTP, without sessions). Everything else is a
// static file and never reaches this Worker (assets.runWorkerFirst in
// cloudflare.config.ts). The pages it reads are the build's: each page's
// Markdown, llms.txt, and the search index the build writes beside it
// (src/lib/agent-files.mjs).

import { docsMcp, docsMcpInstructions, docsTools, serverCard } from './lib/agents';
import { site } from './lib/site';

interface Env {
  ASSETS: { fetch(input: Request | URL | string): Promise<Response> };
}

interface Section {
  heading: string;
  url: string;
  text: string;
}

interface Page {
  url: string;
  title: string;
  sections: Section[];
}

interface Indexed extends Section {
  title: string;
  page: string;
  lowerHeading: string;
  lowerText: string;
  lowerTitle: string;
}

type Id = string | number | null;

interface Message {
  jsonrpc?: string;
  id?: Id;
  method?: string;
  params?: Record<string, unknown>;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-Id',
  'Access-Control-Max-Age': '86400',
};

const json = (body: unknown, status = 200, type = 'application/json') =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': type, ...cors } });

/** Kept for the life of the isolate: the index is the same until the next deploy. */
let index: Indexed[] | undefined;

async function sections(env: Env): Promise<Indexed[]> {
  if (index) return index;
  const response = await env.ASSETS.fetch(new URL(`${docsMcp.path}/search.json`, site.url));
  const pages = (await response.json()) as Page[];
  index = pages.flatMap((page) =>
    page.sections.map((section) => ({
      ...section,
      title: page.title,
      page: page.url,
      lowerHeading: section.heading.toLowerCase(),
      lowerText: section.text.toLowerCase(),
      lowerTitle: page.title.toLowerCase(),
    })),
  );
  return index;
}

const minor = new Set(['a', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'how', 'i', 'in', 'is', 'it', 'my', 'of', 'on', 'or', 'the', 'to', 'what', 'when', 'with']);

function count(haystack: string, needle: string): number {
  let found = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + needle.length)) found++;
  return found;
}

/** A few lines of the section around the first word of the query it holds. */
function excerpt(text: string, lower: string, terms: string[]): string {
  const at = Math.min(...terms.map((term) => lower.indexOf(term)).filter((position) => position !== -1));
  const start = Number.isFinite(at) ? Math.max(0, text.lastIndexOf('\n', Math.max(0, at - 120)) + 1) : 0;
  const plain = text.slice(start, start + 420).replace(/\s+/g, ' ').trim();
  return (start > 0 ? '…' : '') + plain + (start + 420 < text.length ? '…' : '');
}

async function search(env: Env, query: string, limit: number): Promise<string> {
  const words = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}._:/-]*/gu) ?? [])];
  const flags = query.toLowerCase().match(/--?[a-z][a-z-]*/g) ?? [];
  const terms = [...new Set([...flags, ...(words.filter((word) => !minor.has(word)).length ? words.filter((word) => !minor.has(word)) : words)])];
  if (!terms.length) return 'Give the search some words, such as "keep data between runs".';
  const phrase = query.trim().toLowerCase();
  const scored = (await sections(env))
    .map((section) => {
      let score = 0;
      let matched = 0;
      for (const term of terms) {
        const inHeading = count(section.lowerHeading, term);
        const inText = count(section.lowerText, term);
        const inTitle = section.lowerTitle.includes(term);
        if (inHeading || inText || inTitle) matched++;
        score += inHeading * 6 + Math.min(inText, 8) + (inTitle ? 3 : 0);
      }
      if (terms.length > 1 && section.lowerText.includes(phrase)) score += 10;
      return { section, score: matched ? (score * matched) / terms.length : 0 };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
  const perPage = new Map<string, number>();
  const chosen = scored.filter(({ section }) => {
    const seen = perPage.get(section.page) ?? 0;
    perPage.set(section.page, seen + 1);
    return seen < 2;
  });
  if (!chosen.length) return `Nothing in the docs matches "${query}". list_pages lists every page.`;
  return chosen
    .slice(0, limit)
    .map(({ section }, rank) => {
      const where = section.heading && section.heading !== section.title ? `${section.title} › ${section.heading}` : section.title;
      return `${rank + 1}. ${where}\n${section.url}\n${excerpt(section.text, section.lowerText, terms)}`;
    })
    .join('\n\n');
}

/** A page's path from what an agent may give: a path, an address, with .md or a slash. */
function pagePath(input: string): string | undefined {
  let url: URL;
  try {
    url = new URL(input.trim(), site.url);
  } catch {
    return undefined;
  }
  if (url.origin !== site.url && url.hostname !== 'www.firenook.dev') return undefined;
  const path = url.pathname.replace(/\.(md|html)$/, '').replace(/\/+$/, '');
  return path || '/';
}

async function readPage(env: Env, input: string): Promise<{ text: string; failed?: boolean }> {
  const path = pagePath(input);
  if (!path) return { text: `${input} is not a page of firenook.dev. list_pages lists every page.`, failed: true };
  const response = await env.ASSETS.fetch(new URL(path === '/' ? '/index.md' : `${path}.md`, site.url));
  if (!response.ok) return { text: `firenook.dev has no page at ${path}. list_pages lists every page.`, failed: true };
  return { text: await response.text() };
}

async function callTool(env: Env, name: unknown, args: Record<string, unknown>) {
  const result = (text: string, failed = false) => ({ content: [{ type: 'text', text }], ...(failed ? { isError: true } : {}) });
  if (name === 'search_docs') {
    if (typeof args.query !== 'string') return result('search_docs needs a query.', true);
    const limit = Math.min(10, Math.max(1, Math.trunc(Number(args.limit ?? 5)) || 5));
    return result(await search(env, args.query, limit));
  }
  if (name === 'read_page') {
    if (typeof args.path !== 'string') return result('read_page needs a path, such as /docs/get-started/install.', true);
    const page = await readPage(env, args.path);
    return result(page.text, page.failed);
  }
  if (name === 'list_pages') {
    const response = await env.ASSETS.fetch(new URL('/llms.txt', site.url));
    return result(await response.text());
  }
  return undefined;
}

const error = (id: Id, code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } });

async function answer(env: Env, message: Message) {
  if (!message || typeof message !== 'object') return error(null, -32600, 'Not a JSON-RPC 2.0 request');
  const id = message.id ?? null;
  if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') return error(id, -32600, 'Not a JSON-RPC 2.0 request');
  const params = message.params ?? {};
  switch (message.method) {
    case 'initialize': {
      const asked = params.protocolVersion;
      const version = docsMcp.protocolVersions.find((supported) => supported === asked) ?? docsMcp.protocolVersions[0];
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: version,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: docsMcp.name, title: docsMcp.title, version: docsMcp.version, websiteUrl: docsMcp.guide },
          instructions: docsMcpInstructions,
        },
      };
    }
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };
    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: docsTools } };
    case 'tools/call': {
      const result = await callTool(env, params.name, (params.arguments as Record<string, unknown>) ?? {});
      return result ? { jsonrpc: '2.0', id, result } : error(id, -32602, `Unknown tool: ${String(params.name)}`);
    }
    default:
      return error(id, -32601, `Method not found: ${message.method}`);
  }
}

async function mcp(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method === 'GET') {
    // A browser is sent to the page that explains the server; an MCP client
    // asking for an event stream is told there is none.
    if ((request.headers.get('Accept') ?? '').includes('text/event-stream'))
      return new Response('This server answers POST requests only.\n', { status: 405, headers: { Allow: 'POST, OPTIONS', ...cors } });
    return Response.redirect(docsMcp.guide, 302);
  }
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'GET, POST, OPTIONS', ...cors } });

  let body: Message | Message[];
  try {
    body = await request.json();
  } catch {
    return json(error(null, -32700, 'The body is not JSON'), 400);
  }
  const messages = Array.isArray(body) ? body : [body];
  const replies = [];
  for (const message of messages) {
    // Notifications and responses get no reply.
    if (message && typeof message === 'object' && 'method' in message && message.id === undefined) continue;
    if (message && typeof message === 'object' && !('method' in message)) continue;
    replies.push(await answer(env, message));
  }
  if (!replies.length) return new Response(null, { status: 202, headers: cors });
  return json(Array.isArray(body) ? replies : replies[0]);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === docsMcp.path) return mcp(request, env);
    if (pathname === `${docsMcp.path}/server-card`) return json(serverCard, 200, 'application/mcp-server-card+json');
    // Nothing else is served under /docs/mcp, the search index included.
    const page = await env.ASSETS.fetch(new URL('/404', site.url));
    return new Response(page.body, { status: 404, headers: page.headers });
  },
};
