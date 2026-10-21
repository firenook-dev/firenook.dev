// The tools `firenook mcp` gives an agent, in the groups /mcp shows them.
// The list itself is src/data/mcp-tools.json, from the release's tools/list;
// every tool falls into exactly one group, or the build fails.

import mcpTools from '../data/mcp-tools.json';

export interface ToolGroup {
  name: string;
  text: string;
  prefixes: string[];
  tools: string[];
}

const groups: Omit<ToolGroup, 'tools'>[] = [
  {
    name: 'The log and function calls',
    text: 'Search every emulator’s log and each function’s output. List, call and replay functions, and read a failed call’s request, answer, error and stack.',
    prefixes: ['logs', 'functions'],
  },
  {
    name: 'Security Rules',
    text: 'Read the rules in force, ask whether a request would be allowed, and list recent denials with the lines that decided them.',
    prefixes: ['rules'],
  },
  {
    name: 'Firestore',
    text: 'Read, query, count, write and delete documents, and list collections, in any database of the project.',
    prefixes: ['firestore'],
  },
  {
    name: 'Authentication',
    text: 'Find, create and disable users, set their claims, mint an ID token to call a function as them, and read the codes and links Auth would have sent.',
    prefixes: ['auth'],
  },
  {
    name: 'Cloud Storage',
    text: 'List, read, upload, copy, move and delete files, and read their metadata.',
    prefixes: ['storage'],
  },
  {
    name: 'Pub/Sub and schedules',
    text: 'Publish a message, list topics and subscriptions, peek at a backlog without taking it, and run a scheduled function now.',
    prefixes: ['pubsub', 'schedules'],
  },
  {
    name: 'Tasks, Eventarc and Extensions',
    text: 'See and run queued tasks, publish and replay custom events, and reload an extension after changing its parameters.',
    prefixes: ['tasks', 'eventarc', 'extensions'],
  },
  {
    name: 'The suite',
    text: 'What is running and where, an export of its data, and a reset of the services you name.',
    prefixes: ['firenook', 'emulators'],
  },
];

export const version: string = mcpTools.version;
export const toolCount: number = mcpTools.tools.length;

export const toolGroups: ToolGroup[] = groups.map((group) => ({
  ...group,
  tools: mcpTools.tools.map((tool) => tool.name).filter((name) => group.prefixes.includes(name.split('_')[0])),
}));

const grouped = toolGroups.reduce((sum, group) => sum + group.tools.length, 0);
if (grouped !== toolCount) throw new Error(`/mcp groups ${grouped} of the ${toolCount} tools; give every prefix a group`);
