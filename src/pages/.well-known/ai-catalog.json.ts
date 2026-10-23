// What firenook.dev offers agents, as an AI Catalog: the docs' MCP server
// and the Firenook skill.

import type { APIRoute } from 'astro';
import { docsMcp } from '../../lib/agents';
import { site } from '../../lib/site';

export const GET: APIRoute = () =>
  Response.json({
    specVersion: '1.0',
    host: { displayName: site.name, identifier: 'did:web:firenook.dev' },
    entries: [
      {
        identifier: 'urn:air:firenook.dev:mcp:docs',
        displayName: docsMcp.title,
        type: 'application/mcp-server-card+json',
        url: `${docsMcp.url}/server-card`,
        representativeQueries: [
          'how do I switch from the Firebase emulators to Firenook',
          'keep Firestore emulator data between runs',
          'run tests against the Firebase emulators in CI',
          'which Firebase emulator features does Firenook support',
        ],
      },
      {
        identifier: 'urn:air:firenook.dev:skill:firenook',
        displayName: 'Firenook',
        type: 'application/agent-skills+md',
        url: `${site.url}/.well-known/agent-skills/firenook/SKILL.md`,
        representativeQueries: [
          'replace firebase emulators:start with a faster emulator',
          'run the Firebase emulators without Java',
          'call a Cloud Function on the local emulators',
        ],
      },
    ],
  });
