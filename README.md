# firenook.dev

The website and documentation of [Firenook](https://github.com/firenook-dev/firenook),
a drop-in replacement for the Firebase Local Emulator Suite.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build),
written ahead of time into files and served by Cloudflare.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # into dist/, failing on any broken link between docs pages
npm run check:site  # then every link, anchor, title and description in dist/
```

- The docs are Markdown in `src/content/docs/docs/`, the blog in
  `src/content/blog/`. Every page needs a `title` and a `description` of
  160 characters or fewer.
- The home page's terminal is Firenook's own screen, recorded by
  `scripts/terminal/`; its service cards and agent session are a run of the
  demo project, captured by `scripts/capture/`.
- `DESIGN.md` is the design system; `AGENTS.md` has the rules for changing
  the site.

Found a mistake in the docs? Every docs page has an "Edit page" link, and
issues are welcome.

## License

Apache License 2.0. Firenook is not affiliated with or endorsed by Google;
Firebase is a trademark of Google LLC.
