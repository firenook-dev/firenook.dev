# firenook.dev

The website and documentation of Firenook, a drop-in replacement for the
Firebase Local Emulator Suite. Astro with Starlight for the docs, plain CSS,
built ahead of time into files and served by Cloudflare.

## Rules

- This repository is public. It never names a private company, repository,
  host, person's machine or path. The product is Firenook; the code is at
  github.com/firenook-dev/firenook.
- Every fact comes from Firenook itself: the engine repository, the published
  npm package, or a run of it. Every number links to the run that measured it.
  Never write a claim you have not checked.
- Write in plain English: short sentences, active voice, no hype. Say what
  something does. Firebase, Cloud Firestore and the rest are Google's
  trademarks; say so where the site compares, and never use their logos.
- `DESIGN.md` is the design system. Read it before changing how anything
  looks.

## Layout

- `src/pages/`: the site's own pages. `src/content/docs/docs/`: the docs
  (Starlight), at `/docs`. The sidebar is `src/lib/docs-sidebar.mjs`, the docs
  theme `src/styles/docs.css`, Starlight's overridden components
  `src/components/docs/`.
- `src/lib/site.ts`: facts the whole site uses (names, addresses, ports).
- `src/data/terminal-*.json`: the home page's terminal, recorded from the
  published package by `scripts/terminal/` (see its README).
- `src/data/demo-run.json`: what Firenook's MCP tools answered about a run of
  the demo project, captured by `scripts/capture/`. The home page's service
  cards and the agent's session are drawn from it; never edit it by hand.
- `src/lib/pixels.ts`: the block pictures (the flame, the service icons).
- `src/lib/pages.ts`: every page's title, description and link-preview words,
  outside the docs and the blog. A new page adds its entry there.
- `src/lib/benchmarks.ts`, `compatibility.ts`, `changelog.ts`, `mcp.ts`: the
  release's facts the product pages draw from. `src/data/engine/` holds the
  files copied from the engine repository at that release (see its README).
- The blog is Markdown in `src/content/blog/`; `/blog.xml` and
  `/changelog.xml` are its feeds.
- `public/brand/`: the brand kit as /brand offers it, from the engine
  repository's `brand/`.
- Every page has a title and a description of 160 characters or fewer, its
  own link preview (`src/pages/og/`), and structured data.
- Each docs page is also Markdown at its address plus `.md`; `llms.txt` and
  `llms-full.txt` are generated from the docs. The site's own pages get their
  Markdown after the build, from their `<main>` (`src/lib/page-markdown.mjs`,
  run by `src/lib/agent-files.mjs`), which also writes the docs' search index.

## For AI agents

`src/lib/agents.ts` holds what the site offers agents; the docs page about it
is `/docs/tools/agents`.

- `/docs/mcp`: an MCP server over the docs (`src/worker.ts`), with
  `search_docs`, `read_page` and `list_pages`. It reads the build's files:
  each page's `.md`, `llms.txt`, and `docs/mcp/search.json`, which nobody
  else can fetch. A new tool raises `docsMcp.version`.
- The same tools in the browser, through WebMCP (`src/scripts/webmcp.ts`),
  on every page.
- `/.well-known/`: the API catalog, the MCP server card, the AI catalog and
  the skills index (`src/pages/.well-known/`). The skill itself is
  `src/skills/firenook/SKILL.md`: facts from the docs only, like every page.
- `/auth.md` says nothing needs an account. `robots.txt` welcomes every
  crawler with Content Signals; the home page's `Link` header and every
  page's `<link rel="alternate" type="text/markdown">` point to the rest.
- On the zone: two URL rewrite rules give a page's Markdown to a request
  with `Accept: text/markdown` (`/` to `/index.md`, any other page to its
  path plus `.md`), and DNS has `_mcp._agents`, `_index._agents` (SVCB) and
  `_catalog._agents` (TXT) for DNS-AID and ARD.
- `npm run check:site` checks that every page has its Markdown, that every
  search result leads to a page and heading, and the skill's digest.

## Development

```sh
npm install
npm run dev        # astro dev; use `astro dev --background` from an agent
npm run build      # fails on a broken link between docs pages
npm run check      # types
npm run check:site # after a build: every link and anchor, titles, descriptions, previews
npm run package    # after a build: dist/ as Cloudflare's build output (cf-wrangler)
npm run deploy     # cf deploy --prebuilt; CI does this on every push to main
```

The site is the files in `dist/`, served as static assets, which cost
nothing. Its Worker's code (`src/worker.ts`) runs for `/docs/mcp` only
(`runWorkerFirst` in `cloudflare.config.ts`); keep every other address static.
Never add an adapter (`cf init` on this project adds the Astro Cloudflare
adapter; don't run it). `www.firenook.dev` redirects to `firenook.dev` by a
zone redirect rule; the Worker has no `workers.dev` address.

A new release: copy the engine's changelog and compatibility facts, add its
npm publish time to `published` in `src/lib/changelog.ts` (and to `measured`
anything its notes measured before and after), set `site.version` and
`site.release`, record the terminal and capture the demo run again (their
READMEs), and check every page that quotes a number against the release.
