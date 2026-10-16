import { count, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { user, } from '@/db/auth-schema';
import { pages } from '@/db/app-schema';
import { bucket, loadState, saveState, send, startedProps, telemetryEnabled, NOTICE } from './telemetry';

const DAY = 86_400_000;
let started = false;

async function alive(id: string) {
  const [[a], [p], [pub]] = await Promise.all([
    db.select({ n: count() }).from(user), db.select({ n: count() }).from(pages), db.select({ n: count() }).from(pages).where(isNotNull(pages.published)),
  ]);
  return send('posy.instance.alive', id, { accounts: bucket(a.n), pages: bucket(p.n), published_pages: bucket(pub.n) });
}

/** Called once from instrumentation.ts on the self-hosted edition. Never throws. */
export async function startTelemetry() {
  try {
    if (started || !telemetryEnabled()) return;
    started = true;
    const { state, created, persisted } = loadState();
    if (created) console.log(NOTICE);
    void send('posy.instance.started', state.id, startedProps());
    // Daily heartbeat. Only with a persisted state file: without one every restart would look like a new day.
    if (!persisted) return;
    const tick = async () => {
      if (Date.now() - (state.lastAlive ?? 0) < DAY) return;
      if (await alive(state.id).catch(() => false)) { state.lastAlive = Date.now(); saveState(state); }
    };
    setTimeout(() => void tick(), 60_000).unref();
    setInterval(() => void tick(), 6 * 3_600_000).unref();
  } catch { /* telemetry must never break the server */ }
}

/** `posy.page.published`: look, layout and a tile-count bucket. Nothing the owner wrote. */
export function pagePublished(page: unknown) {
  if (!telemetryEnabled()) return;
  try {
    const p = (page ?? {}) as { style?: unknown; layout?: unknown; tiles?: unknown };
    const { state } = loadState();
    void send('posy.page.published', state.id, {
      look: typeof p.style === 'string' ? p.style.slice(0, 20) : 'unknown',
      layout: typeof p.layout === 'string' ? p.layout.slice(0, 20) : 'unknown',
      tiles: bucket(Array.isArray(p.tiles) ? p.tiles.length : 0),
    });
  } catch { /* ignore */ }
}
