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
  `llms-full.txt` are generated from the docs.

## Development

```sh
npm install
npm run dev        # astro dev; use `astro dev --background` from an agent
npm run build      # fails on a broken link between docs pages
npm run check      # types
npm run check:site # after a build: every link and anchor, titles, descriptions, previews
```

A new release: copy the engine's changelog and compatibility facts, add its
npm publish time to `published` in `src/lib/changelog.ts` (and to `measured`
anything its notes measured before and after), set `site.version` and
`site.release`, record the terminal and capture the demo run again (their
READMEs), and check every page that quotes a number against the release.
