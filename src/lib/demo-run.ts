// A run of the demo project, kept by scripts/capture/: what Firenook's MCP
// tools answered about it. The home page draws its services and the agent's
// session from these answers, as they came.

import run from '../data/demo-run.json';

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  isError: boolean;
  result: any;
}

export const demoRun = run as { version: string; capturedAt: string; calls: ToolCall[] };

/** The first call of a tool, or of a tool with these arguments. */
export function call(tool: string, args?: Record<string, unknown>): ToolCall {
  const found = demoRun.calls.find(
    (entry) =>
      entry.tool === tool &&
      (!args || Object.entries(args).every(([key, value]) => JSON.stringify(entry.args[key]) === JSON.stringify(value))),
  );
  if (!found) throw new Error(`demo-run.json has no ${tool} call${args ? ` with ${JSON.stringify(args)}` : ''}`);
  return found;
}

/** A time from the run, as the console shows it: 08:37:05. */
export const clock = (iso: string) => iso.slice(11, 19);

/** A function's name without its region: us-central1-checkout → checkout. */
export const functionName = (id: string) => id.replace(/^[a-z]+-[a-z]+\d+-/, '');
