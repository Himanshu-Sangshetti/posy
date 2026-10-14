'use client';

import { createContext, useContext } from 'react';
import type { Entitlements } from '@/edition/types';

const Ctx = createContext<Entitlements | null>(null);
export const EntitlementsProvider = Ctx.Provider;
export function useEntitlements(): Entitlements {
  return useContext(Ctx) ?? { plan: 'self-hosted', removeBranding: true, analyticsDays: 365, analyticsExport: true, premium: true, customDomain: true };
}
