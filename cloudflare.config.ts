// firenook.dev on Cloudflare: a Worker with no code of its own, only the
// files in dist/ (wrangler.config.ts). Every request is a static asset, which
// Cloudflare serves without running a Worker. /docs/install is served from
// docs/install.html, /docs/install.html redirects to /docs/install, and an
// address with no file gets 404.html with a 404 status. public/_headers sets
// the headers. www.firenook.dev is sent to firenook.dev by a redirect rule.
import { defineConfig } from 'cf/config';

export default defineConfig({
  worker: {
    name: 'firenook-dev',
    compatibilityDate: '2026-10-19',
    assets: {
      htmlHandling: 'auto-trailing-slash',
      notFoundHandling: '404-page',
    },
    domains: ['firenook.dev', 'www.firenook.dev'],
    // The site has one address: no copy on workers.dev.
    workersDev: false,
    previewUrls: false,
  },
});
