// The site's own pages (not the docs or the blog): each one's title for the
// browser and search results, its description, and the words on its link
// preview, which /og draws. A page reads its entry with page('/path').

export interface PageMeta {
  /** The <title>: what the page is, then the site. */
  title: string;
  /** For search results and link previews: 160 characters at most. */
  description: string;
  /** The link preview's own words, shorter than the title. */
  card: { title: string; subtitle: string; section?: string };
  /** In the breadcrumbs search engines read. */
  crumb: string;
}

export const pages = {
  '/mcp': {
    title: 'Firebase MCP for your local emulators · Firenook',
    description:
      'firenook mcp gives Claude Code, Cursor and other coding agents 54 tools over the Firebase emulators on your machine: logs, function calls, rules and data.',
    card: { title: 'Firebase MCP for your local emulators', subtitle: 'Give your coding agent the emulator, not production: logs, function calls, Security Rules and your data.' },
    crumb: 'MCP',
  },
  '/firestore-emulator': {
    title: 'A faster Firestore emulator, without Java · Firenook',
    description:
      'Firenook’s Firestore emulator answers the same SDKs on port 8080: writes 38× faster, 9× less memory, no Java, and data that survives restarts.',
    card: { title: 'A faster Firestore emulator', subtitle: 'The same SDKs and port 8080, writes 38× faster, 9× less memory, no Java, and data that survives restarts.' },
    crumb: 'Firestore emulator',
  },
  '/pubsub-emulator': {
    title: 'A Pub/Sub emulator with a console, without Java · Firenook',
    description:
      'Run the Pub/Sub emulator on its own with one npm command: every RPC over gRPC and HTTP/JSON on port 8085, push delivery, and a console. No Java, no gcloud.',
    card: { title: 'A Pub/Sub emulator, without Java', subtitle: 'Every RPC over gRPC and HTTP/JSON on port 8085, on its own or with Functions, with a console to see it.' },
    crumb: 'Pub/Sub emulator',
  },
  '/console': {
    title: 'The console for the Firebase emulators · Firenook',
    description:
      'Firenook’s console covers every emulator it runs, live, on the Emulator UI’s port: function calls, Firestore, Auth, Storage, Pub/Sub, Tasks, Eventarc and rules.',
    card: { title: 'The console the Firebase emulators should have had', subtitle: 'Every service it runs, live, on the Emulator UI’s port: calls, data, users, files, messages and rules.' },
    crumb: 'Console',
  },
  '/benchmarks': {
    title: 'Benchmarks: Firenook against the Firebase emulator · Firenook',
    description:
      'Two hours of a real application’s traffic against each emulator: writes, listeners, queries, memory, CPU, restarts and 26 query shapes, the losses included.',
    card: { title: 'Firenook against the official emulator', subtitle: 'Two hours of a real application’s traffic on each, measured by the client. Every result, the losses included.' },
    crumb: 'Benchmarks',
  },
  '/compatibility': {
    title: 'Compatibility: what each emulator covers · Firenook',
    description:
      'What Firenook’s Firestore, Auth, Storage, Functions, Extensions, Pub/Sub, Cloud Tasks and Eventarc emulators cover in 0.2.0-next.8, and what they do not.',
    card: { title: 'What each emulator covers', subtitle: 'Service by service, what Firenook does in this release, what it does not, and where it differs from the official emulator.' },
    crumb: 'Compatibility',
  },
  '/vs/firebase-emulator-suite': {
    title: 'Firenook compared with the Firebase Local Emulator Suite',
    description:
      'Firenook beside the official Firebase emulators: what each runs on, speed, memory, data between runs, the console, MCP, and where the official suite is ahead.',
    card: { title: 'Firenook and the Firebase Local Emulator Suite', subtitle: 'Side by side: what each needs, how fast it is, what it keeps, and where the official suite is still ahead.' },
    crumb: 'Compared',
  },
  '/changelog': {
    title: 'Changelog · Firenook',
    description: 'Every Firenook release, newest first: what changed, what was fixed and what to know before upgrading. Also as an RSS feed.',
    card: { title: 'Changelog', subtitle: 'Every Firenook release, newest first: what changed, what was fixed and what to know before upgrading.' },
    crumb: 'Changelog',
  },
  '/blog': {
    title: 'Blog · Firenook',
    description: 'Posts from the people building Firenook: how it works, what it measures, and what is coming. Also as an RSS feed.',
    card: { title: 'The Firenook blog', subtitle: 'How Firenook works, what it measures, and what is coming.' },
    crumb: 'Blog',
  },
  '/brand': {
    title: 'Brand kit · Firenook',
    description: 'The Firenook logo, mark, wordmark, block flame and colours, as SVG and PNG, with how to use them and the embers as a looping video.',
    card: { title: 'Brand kit', subtitle: 'The logo, the mark, the block flame, the embers and the colours, ready to download.' },
    crumb: 'Brand',
  },
  '/privacy': {
    title: 'Privacy · Firenook',
    description: 'What firenook.dev and Firenook collect: the site sets no cookies and runs no analytics, and Firenook sends no telemetry.',
    card: { title: 'Privacy', subtitle: 'The site sets no cookies and runs no analytics. Firenook sends no telemetry.' },
    crumb: 'Privacy',
  },
  '/security': {
    title: 'Security · Firenook',
    description: 'How to report a vulnerability in Firenook privately, what is in scope, and what to expect after you report it.',
    card: { title: 'Security', subtitle: 'How to report a vulnerability privately, what is in scope, and what happens next.' },
    crumb: 'Security',
  },
  '/trademark': {
    title: 'Trademarks · Firenook',
    description: 'How to use the Firenook name and logo, and the trademarks of others the site mentions. Firenook is independent and not affiliated with Google.',
    card: { title: 'Trademarks', subtitle: 'How to use the Firenook name and logo. Firenook is independent and not affiliated with Google.' },
    crumb: 'Trademarks',
  },
} satisfies Record<string, PageMeta>;

export type PagePath = keyof typeof pages;

export const page = (path: PagePath): PageMeta => pages[path];

/** /vs/firebase-emulator-suite → vs-firebase-emulator-suite, the link preview's file. */
export const cardSlug = (path: string) => path.slice(1).replace(/\//g, '-');
