// The docs' sidebar, in reading order. The config draws it, and llms.txt and
// llms-full.txt follow the same order.

/** @type {import('@astrojs/starlight/types').StarlightUserConfig['sidebar']} */
export const sidebar = [
  { label: 'Introduction', link: '/docs' },
  {
    label: 'Get started',
    items: [
      { label: 'Install', link: '/docs/get-started/install' },
      { label: 'Switch from the Firebase emulators', link: '/docs/get-started/switch' },
      { label: 'Start a new project', link: '/docs/get-started/new-project' },
      {
        label: 'Connect your app',
        collapsed: true,
        items: [
          { label: 'Overview', link: '/docs/get-started/connect' },
          { label: 'Web', link: '/docs/get-started/connect/web' },
          { label: 'Flutter', link: '/docs/get-started/connect/flutter' },
          { label: 'Android', link: '/docs/get-started/connect/android' },
          { label: 'Apple platforms', link: '/docs/get-started/connect/apple' },
          { label: 'React Native', link: '/docs/get-started/connect/react-native' },
          { label: 'Server SDKs', link: '/docs/get-started/connect/server' },
        ],
      },
      { label: 'Run your tests', link: '/docs/get-started/tests' },
      { label: 'CI and GitHub Actions', link: '/docs/get-started/ci' },
      { label: 'Docker', link: '/docs/get-started/docker' },
      { label: 'Run one service on its own', link: '/docs/get-started/one-service' },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'Firestore', link: '/docs/services/firestore' },
      { label: 'Authentication', link: '/docs/services/auth' },
      { label: 'Cloud Storage', link: '/docs/services/storage' },
      { label: 'Cloud Functions', link: '/docs/services/functions' },
      { label: 'Extensions', link: '/docs/services/extensions' },
      { label: 'Pub/Sub', link: '/docs/services/pubsub' },
      { label: 'Cloud Tasks', link: '/docs/services/tasks' },
      { label: 'Eventarc', link: '/docs/services/eventarc' },
      { label: 'Security Rules', link: '/docs/services/rules' },
    ],
  },
  {
    label: 'Cloud Functions in depth',
    items: [
      { label: 'TypeScript functions', link: '/docs/functions/typescript' },
      { label: 'Scheduled functions', link: '/docs/functions/scheduled' },
      { label: 'Environment variables and secrets', link: '/docs/functions/environment' },
      { label: 'Debugging and reload on save', link: '/docs/functions/debugging' },
    ],
  },
  {
    label: 'Your data',
    items: [
      { label: 'Keep data between runs', link: '/docs/data/keep-data' },
      { label: 'Seeds and imports', link: '/docs/data/seeds' },
      { label: 'Export and snapshots', link: '/docs/data/export' },
      { label: 'Inspect and compact', link: '/docs/data/inspect' },
      { label: 'Recovery after a crash', link: '/docs/data/recovery' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'The console', link: '/docs/tools/console' },
      { label: 'The terminal', link: '/docs/tools/terminal' },
      { label: 'Connect your coding agent', link: '/docs/tools/mcp' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { label: 'CLI commands', link: '/docs/reference/cli' },
      { label: 'Configuration', link: '/docs/reference/configuration' },
      { label: 'Ports', link: '/docs/reference/ports' },
      { label: 'MCP tools', link: '/docs/reference/mcp-tools' },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'Troubleshooting', link: '/docs/help/troubleshooting' },
      { label: 'The Java 21 error', link: '/docs/help/java' },
      { label: 'Windows', link: '/docs/help/windows' },
      { label: 'Without a Google login', link: '/docs/help/no-login' },
      { label: 'FAQ', link: '/docs/help/faq' },
      { label: 'Versions and verification', link: '/docs/help/versions' },
      { label: 'Former name', link: '/docs/help/former-name' },
      { label: 'Report a problem', link: '/docs/help/report' },
    ],
  },
  {
    label: 'Contribute',
    items: [
      { label: 'Build from source', link: '/docs/contribute/build' },
      { label: 'Architecture', link: '/docs/contribute/architecture' },
    ],
  },
];

/** Every page in the sidebar, in order, with the groups it is in. */
export function sidebarPages(entries = sidebar, groups = []) {
  /** @type {{ link: string; label: string; groups: string[] }[]} */
  const pages = [];
  for (const entry of entries) {
    if (typeof entry === 'string') continue;
    if ('link' in entry && entry.link) pages.push({ link: entry.link, label: entry.label, groups });
    if ('items' in entry && entry.items) pages.push(...sidebarPages(entry.items, [...groups, entry.label]));
  }
  return pages;
}
