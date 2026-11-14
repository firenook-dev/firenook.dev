// The count of Firenook's update checks (from firenook 0.2.5). The npm
// package asks /api/version which versions are current at most once a day on
// a machine, never in CI or the plain output, and never when
// FIRENOOK_NO_UPDATE_CHECK, NO_UPDATE_NOTIFIER or DO_NOT_TRACK is set. This
// Worker answers with npm's version tags for firenook, as the registry would,
// and adds one to that day's count for the version and platform the request
// names. Nothing else is kept: no address, no id, no project. /api/usage
// answers the counts of the last 90 days to a request carrying the Worker's
// USAGE_TOKEN secret, and 404 to any other (and to every request while the
// secret is not set): the totals are private.

/** The Durable Object's SQLite storage, as much of it as this file uses. */
interface Sql {
  exec(query: string, ...bindings: unknown[]): { toArray(): Record<string, unknown>[] };
}

interface CounterState {
  storage: { sql: Sql };
}

interface CounterStub {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

export interface UsageEnv {
  USAGE: { idFromName(name: string): unknown; get(id: unknown): CounterStub };
  /** The secret that reads /api/usage; unset, nothing reads it. */
  USAGE_TOKEN?: string;
}

interface Context {
  waitUntil(promise: Promise<unknown>): void;
}

const REGISTRY = 'https://registry.npmjs.org/-/package/firenook/dist-tags';
/** A release's version, as the package sends it. */
const VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-[0-9A-Za-z.]{1,32})?$/;
/** The platforms Firenook publishes an engine for. */
const PLATFORMS = new Set(['darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64', 'win32-x64']);
const DAYS = 90;

/** One counter for the whole site: a few thousand checks a day at most. */
const counter = (env: UsageEnv) => env.USAGE.get(env.USAGE.idFromName('update-checks'));

export class UsageCounter {
  private readonly sql: Sql;

  constructor(state: CounterState) {
    this.sql = state.storage.sql;
    this.sql.exec(
      'CREATE TABLE IF NOT EXISTS checks (day TEXT NOT NULL, version TEXT NOT NULL, platform TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY (day, version, platform))',
    );
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method === 'POST') {
      const { day, version, platform } = (await request.json()) as Record<string, string>;
      this.sql.exec(
        'INSERT INTO checks VALUES (?, ?, ?, 1) ON CONFLICT (day, version, platform) DO UPDATE SET count = count + 1',
        day,
        version,
        platform,
      );
      return new Response(null, { status: 204 });
    }
    const since = new URL(request.url).searchParams.get('since') ?? '';
    const rows = this.sql
      .exec('SELECT day, version, platform, count FROM checks WHERE day >= ? ORDER BY day, version, platform', since)
      .toArray();
    return Response.json(rows);
  }
}

const today = (offset = 0) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);

/** GET /api/version?v=<version>&p=<platform>: npm's version tags, counted. */
export async function version(request: Request, env: UsageEnv, context: Context): Promise<Response> {
  const query = new URL(request.url).searchParams;
  const named = query.get('v') ?? '';
  const platform = query.get('p') ?? '';
  // Only what a release sends is counted, so the table holds no free text.
  if (VERSION.test(named) && PLATFORMS.has(platform)) {
    const body = JSON.stringify({ day: today(), version: named, platform });
    context.waitUntil(counter(env).fetch('https://counter/', { method: 'POST', body }));
  }
  const tags = await fetch(REGISTRY, { cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit);
  if (!tags.ok) return new Response('The npm registry did not answer.\n', { status: 502 });
  return new Response(await tags.text(), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Whether `request` carries the USAGE_TOKEN secret, compared in constant time. */
function reader(request: Request, env: UsageEnv): boolean {
  const token = env.USAGE_TOKEN;
  const given = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
  if (!token || given.length !== token.length) return false;
  const encoder = new TextEncoder();
  const subtle = crypto.subtle as SubtleCrypto & { timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean };
  return subtle.timingSafeEqual(encoder.encode(given), encoder.encode(token));
}

/** GET /api/usage: each day's checks, by version and by platform, for the token's holder. */
export async function usage(request: Request, env: UsageEnv): Promise<Response> {
  if (!reader(request, env)) return new Response('Not found\n', { status: 404 });
  const response = await counter(env).fetch(`https://counter/?since=${today(DAYS - 1)}`);
  const rows = (await response.json()) as { day: string; version: string; platform: string; count: number }[];
  const days = new Map<string, { day: string; checks: number; versions: Record<string, number>; platforms: Record<string, number> }>();
  for (const row of rows) {
    const entry = days.get(row.day) ?? { day: row.day, checks: 0, versions: {}, platforms: {} };
    entry.checks += row.count;
    entry.versions[row.version] = (entry.versions[row.version] ?? 0) + row.count;
    entry.platforms[row.platform] = (entry.platforms[row.platform] ?? 0) + row.count;
    days.set(row.day, entry);
  }
  return Response.json(
    {
      about: 'Firenook update checks per day: one machine checks at most once a day, never in CI. https://firenook.dev/privacy',
      days: [...days.values()],
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
