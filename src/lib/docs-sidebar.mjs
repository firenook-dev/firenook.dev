// The docs' sidebar, in reading order. The config draws it, and llms.txt and
// llms-full.txt follow the same order.

/** @type {import("@astrojs/starlight/types").StarlightUserConfig["sidebar"]} */
export const sidebar = [
  { label: 'Introduction', link: '/docs' },
  {
    label: 'Get started',
    items: [
      { label: 'Install', link: '/docs/get-started/install' },
      { label: 'Switch from the Firebase emulators', link: '/docs/get-started/switch' },
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
