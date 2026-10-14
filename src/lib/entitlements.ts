import 'server-only';
import { edition } from '@/edition';
import type { Entitlements } from '@/edition/types';
import type { Page } from './schema';
import { PREMIUM_THEMES } from './themes';
import { PREMIUM_FONTS } from './style';

export class EntitlementError extends Error {}

export const entitlementsFor = (userId: string) => edition.entitlements(userId);

/** Reject saves that use features the account's plan doesn't include. */
export function assertAllowed(page: Page, e: Entitlements) {
  if (!e.premium && PREMIUM_THEMES.has(page.theme.preset)) throw new EntitlementError(`The "${page.theme.preset}" theme is part of Posy Pro.`);
  if (!e.premium && PREMIUM_FONTS.has(page.theme.font)) throw new EntitlementError(`The "${page.theme.font}" font is part of Posy Pro.`);
  if (!e.removeBranding && !page.badge) throw new EntitlementError('Hiding "Made with Posy" is part of Posy Pro.');
}

/** What visitors see if a plan lapses: fall back gracefully instead of breaking the page. */
export function applyEntitlements(page: Page, e: Entitlements): Page {
  return {
    ...page,
    badge: e.removeBranding ? page.badge : true,
    theme: {
      ...page.theme,
      preset: !e.premium && PREMIUM_THEMES.has(page.theme.preset) ? 'cream' : page.theme.preset,
      font: !e.premium && PREMIUM_FONTS.has(page.theme.font) ? 'soft' : page.theme.font,
    },
  };
}
