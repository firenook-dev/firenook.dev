// firenook.dev on Cloudflare: the files in dist/ (wrangler.config.ts), served
// without running code, and one Worker for one address: /docs/mcp, the docs'
// MCP server (src/worker.ts). Only requests under /docs/mcp reach it
// (runWorkerFirst); every other request is a static asset. /docs/install is
// served from docs/install.html, /docs/install.html redirects to
// /docs/install, and an address with no file gets 404.html with a 404
// status. public/_headers sets the headers. www.firenook.dev is sent to
// firenook.dev by a redirect rule.
import { bindings, defineConfig } from 'cf/config';

export default defineConfig({
  worker: {
    name: 'firenook-dev',
    compatibilityDate: '2026-10-19',
    entrypoint: './src/worker.ts',
    assets: {
      htmlHandling: 'auto-trailing-slash',
      notFoundHandling: '404-page',
      runWorkerFirst: ['/docs/mcp', '/docs/mcp/*'],
    },
    env: { ASSETS: bindings.assets() },
    domains: ['firenook.dev', 'www.firenook.dev'],
    // The site has one address: no copy on workers.dev.
    workersDev: false,
    previewUrls: false,
  },
});
