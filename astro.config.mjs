// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import starlightLinksValidator from 'starlight-links-validator';
import { sidebar } from './src/lib/docs-sidebar.mjs';

// firenook.dev: every page is built ahead of time, as a file, and Cloudflare
// serves them. The docs, at /docs, are Starlight: Markdown in
// src/content/docs/docs/, drawn in the site's colours (src/styles/docs.css).
export default defineConfig({
  site: 'https://firenook.dev',
  trailingSlash: 'never',
  build: { format: 'file' },

  integrations: [
    starlight({
      title: 'Firenook Docs',
      description: 'How to run the Firebase emulators with Firenook: install, switch, services, data, the console, the terminal and MCP.',
      titleDelimiter: '·',
      logo: {
        light: './src/assets/brand/firenook-logo-flat.svg',
        dark: './src/assets/brand/firenook-logo-flat-on-dark.svg',
        replacesTitle: true,
      },
      // The site has its own not-found page.
      disable404Route: true,
      credits: false,
      favicon: '/favicon.svg',
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
      ],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/firenook-dev/firenook' }],
      editLink: { baseUrl: 'https://github.com/firenook-dev/firenook.dev/edit/main/' },
      lastUpdated: true,
      markdown: { headingLinks: true },
      customCss: ['./src/styles/docs.css'],
      routeMiddleware: './src/lib/docs-route.ts',
      components: {
        Head: './src/components/docs/Head.astro',
        SocialIcons: './src/components/docs/SocialIcons.astro',
      },
      expressiveCode: {
        themes: ['github-dark-default', 'github-light-default'],
        styleOverrides: {
          borderRadius: '10px',
          borderColor: 'var(--sl-color-hairline)',
          codeFontFamily: 'var(--__sl-font-mono)',
          codeFontSize: '0.84rem',
          uiFontFamily: 'var(--__sl-font)',
          textMarkers: {
            insBackground: 'rgb(76 195 138 / 0.13)',
            insBorderColor: 'rgb(76 195 138 / 0.55)',
            delBackground: 'rgb(255 106 95 / 0.12)',
            delBorderColor: 'rgb(255 106 95 / 0.5)',
          },
          frames: {
            shadowColor: 'transparent',
            editorActiveTabIndicatorTopColor: 'var(--sl-color-accent)',
            terminalTitlebarBackground: 'var(--docs-code-bar)',
            editorTabBarBackground: 'var(--docs-code-bar)',
          },
        },
      },
      sidebar,
      plugins: [
        // Every link between docs pages, and to a heading on one, must lead
        // somewhere. The site's own pages are not docs, so they are left out.
        starlightLinksValidator({
          exclude: [
            '/',
            '/benchmarks',
            '/compatibility',
            '/console',
            '/mcp',
            '/firestore-emulator',
            '/pubsub-emulator',
            '/vs/**',
            '/blog',
            '/blog/**',
            '/changelog',
            '/brand',
            '/privacy',
            '/security',
            '/trademark',
            '/*.txt',
            '/docs/**/*.md',
          ],
        }),
      ],
    }),
    sitemap({ filter: (page) => !page.includes('/404') }),
  ],
});
