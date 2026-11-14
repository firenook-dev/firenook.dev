// firenook.dev on Cloudflare: the files in dist/ (wrangler.config.ts), served
// without running code, and one Worker for three addresses: /docs/mcp, the
// docs' MCP server, and /api/version and /api/usage, the update check and its
// count, kept in one SQLite Durable Object (src/worker.ts, src/usage.ts).
// Only requests to those reach it (runWorkerFirst); every other request is a static asset. /docs/install is
// served from docs/install.html, /docs/install.html redirects to
// /docs/install, and an address with no file gets 404.html with a 404
// status. public/_headers sets the headers. www.firenook.dev is sent to
// firenook.dev by a redirect rule.
import { bindings, defineConfig, exports } from 'cf/config';

export default defineConfig({
  worker: {
    name: 'firenook-dev',
    compatibilityDate: '2026-10-19',
    entrypoint: './src/worker.ts',
    assets: {
      htmlHandling: 'auto-trailing-slash',
      notFoundHandling: '404-page',
      runWorkerFirst: ['/docs/mcp', '/docs/mcp/*', '/api/version', '/api/usage'],
    },
    exports: { UsageCounter: exports.durableObject({ storage: 'sqlite' }) },
    env: {
      ASSETS: bindings.assets(),
      USAGE: bindings.durableObject({ worker: 'firenook-dev', exportName: 'UsageCounter' }),
    },
    domains: ['firenook.dev', 'www.firenook.dev'],
    // The site has one address: no copy on workers.dev.
    workersDev: false,
    previewUrls: false,
  },
});
