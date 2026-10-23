// The docs' MCP tools, offered to an agent that works in this page in the
// browser (WebMCP): each one asks the docs' MCP server at /docs/mcp, and
// open_page goes to a page in this tab. Browsers without WebMCP skip it.

import { docsMcp, docsTools } from '../lib/agents';

interface Result {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

interface ModelContext {
  registerTool(tool: {
    name: string;
    title?: string;
    description: string;
    inputSchema: object;
    annotations?: object;
    execute(input: Record<string, unknown>): Promise<Result>;
  }): unknown;
}

// Newer Chrome has it on document; earlier builds on navigator.
const context =
  (document as Document & { modelContext?: ModelContext }).modelContext ??
  (navigator as Navigator & { modelContext?: ModelContext }).modelContext;

let id = 0;

async function call(name: string, input: Record<string, unknown>): Promise<Result> {
  const response = await fetch(docsMcp.path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name, arguments: input } }),
  });
  const reply = await response.json();
  if (reply.error) return { content: [{ type: 'text', text: reply.error.message }], isError: true };
  return reply.result;
}

function register(tool: Parameters<ModelContext['registerTool']>[0]) {
  try {
    // A promise in the current draft, nothing in earlier ones.
    Promise.resolve(context!.registerTool(tool)).catch(() => {});
  } catch {
    // Already registered by an earlier copy of this script.
  }
}

if (context?.registerTool) {
  for (const tool of docsTools) register({ ...tool, execute: (input) => call(tool.name, input ?? {}) });
  register({
    name: 'open_page',
    title: 'Open a page',
    description: 'Go to a page of firenook.dev in this tab, such as /docs/get-started/install or /benchmarks.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'The page’s path, such as /docs/data/keep-data.' } },
      required: ['path'],
      additionalProperties: false,
    },
    async execute(input) {
      const url = new URL(String(input.path ?? '/'), location.origin);
      if (url.origin !== location.origin) return { content: [{ type: 'text', text: `${url.href} is not on firenook.dev.` }], isError: true };
      location.assign(url.href);
      return { content: [{ type: 'text', text: `Opening ${url.href}` }] };
    },
  });
}
