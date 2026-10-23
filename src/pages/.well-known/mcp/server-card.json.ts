// The docs' MCP server card, where scanners look for it. The Worker serves
// the same card at /docs/mcp/server-card.

import type { APIRoute } from 'astro';
import { serverCard } from '../../../lib/agents';

export const GET: APIRoute = () => Response.json(serverCard);
