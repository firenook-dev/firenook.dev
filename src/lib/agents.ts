// What firenook.dev offers AI agents, in one place: an MCP server over the
// docs (src/worker.ts), the tools it has, which the pages also offer in the
// browser (src/scripts/webmcp.ts), and the cards under /.well-known that
// point to them. The docs page for it is /docs/tools/agents.

import { site } from './site';

export const docsMcp = {
  /** Where the Worker answers; every other address is a static file. */
  path: '/docs/mcp',
  url: `${site.url}/docs/mcp`,
  name: 'dev.firenook/docs',
  title: 'Firenook Docs',
  /** The server's own version, raised when its tools change. */
  version: '1.0.0',
  description:
    'Search and read the documentation of Firenook, the faster drop-in replacement for the Firebase Local Emulator Suite: install, switching, each service, data, Functions, the console, MCP, the CLI, compatibility, benchmarks and the changelog.',
  guide: `${site.url}/docs/tools/agents`,
  /** Newest first: an initialize asking for another version gets the first. */
  protocolVersions: ['2025-11-25', '2025-06-18', '2025-03-26'],
} as const;

export const docsMcpInstructions =
  'Firenook runs the Firebase emulators (Firestore, Auth, Storage, Functions, Extensions, Pub/Sub, Cloud Tasks, Eventarc) from one npm package, with the same firebase.json, SDKs and ports. Use search_docs to find the page that answers a question, then read_page for the whole page. list_pages lists every page. The docs describe the latest release, ' +
  site.version +
  '.';

interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, object>; required?: string[]; additionalProperties: false };
  annotations: { readOnlyHint: true; openWorldHint: false };
}

const readOnly = { readOnlyHint: true, openWorldHint: false } as const;

export const docsTools: Tool[] = [
  {
    name: 'search_docs',
    title: 'Search the Firenook docs',
    description:
      'Search the Firenook docs and website: installing, switching from the Firebase emulators, each service, keeping data, Functions, the console, MCP, the CLI, ports, compatibility, benchmarks and release notes. Returns the best-matching sections with their addresses; read a whole page with read_page.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to look for, in words or as a command or flag, such as "keep data between runs" or "--import".' },
        limit: { type: 'integer', minimum: 1, maximum: 10, default: 5, description: 'How many sections to return.' },
      },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: readOnly,
  },
  {
    name: 'read_page',
    title: 'Read a page',
    description:
      'Read a page of firenook.dev as Markdown: a docs page such as /docs/get-started/install, another page such as /compatibility or /changelog/0.2.0, or its full https://firenook.dev address.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'The page’s path or address, such as /docs/data/keep-data.' } },
      required: ['path'],
      additionalProperties: false,
    },
    annotations: readOnly,
  },
  {
    name: 'list_pages',
    title: 'List the pages',
    description: 'List every page of firenook.dev, docs first by section, each with its address and one line on what it covers.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: readOnly,
  },
];

/**
 * The MCP server's card. `name`, `version`, `description` and `remotes` are
 * the Server Card draft's fields (SEP-2127); `serverInfo`, `transport` and
 * `capabilities` are the earlier draft's, which scanners still read.
 */
export const serverCard = {
  $schema: 'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json',
  name: docsMcp.name,
  version: docsMcp.version,
  title: docsMcp.title,
  description: docsMcp.description,
  websiteUrl: docsMcp.guide,
  repository: { url: site.siteRepo, source: 'github' },
  remotes: [{ type: 'streamable-http', url: docsMcp.url, supportedProtocolVersions: [...docsMcp.protocolVersions] }],
  serverInfo: { name: docsMcp.name, title: docsMcp.title, version: docsMcp.version },
  url: docsMcp.url,
  transport: { type: 'streamable-http', endpoint: docsMcp.url },
  capabilities: { tools: { listChanged: false } },
  authentication: { required: false },
};
