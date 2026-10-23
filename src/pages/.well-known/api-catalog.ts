// The site's one API, the docs' MCP server, as an RFC 9727 API catalog.
// public/_headers serves it as application/linkset+json.

import type { APIRoute } from 'astro';
import { docsMcp } from '../../lib/agents';
import { site } from '../../lib/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      linkset: [
        {
          anchor: docsMcp.url,
          'service-desc': [{ href: `${site.url}/.well-known/mcp/server-card.json`, type: 'application/json' }],
          'service-doc': [
            { href: docsMcp.guide, type: 'text/html' },
            { href: `${docsMcp.guide}.md`, type: 'text/markdown' },
          ],
        },
      ],
    }),
    { headers: { 'Content-Type': 'application/linkset+json' } },
  );
