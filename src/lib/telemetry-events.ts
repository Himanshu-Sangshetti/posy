import 'server-only';
import { edition } from '@/edition';
import type { ProductEvent } from '@/edition/types';
import { pagePublished } from './telemetry-runtime';

/**
 * The one call site server code uses when something worth counting happens. Never throws, never awaits.
 * The hosted platform gets every event through `edition.track`; a self-hosted instance only ever
 * reports `page.published` (see docs/telemetry.md), and only when telemetry is on.
 */
export function track(e: ProductEvent) {
  try {
    edition.track?.(e);
    if (edition.id === 'self-hosted' && e.type === 'page.published') pagePublished(e.page);
  } catch { /* analytics must not break the product */ }
}
