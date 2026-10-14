// Self-hosted edition (open source). The hosted platform replaces this file.
import 'server-only';
import type { Edition } from './types';

const signup = (process.env.POSY_SIGNUP as Edition['signup']) || 'first-user';

export const edition: Edition = {
  id: 'self-hosted',
  signup,
  root: 'owner-page',
  // Your server, your rules: everything the open-source edition has is unlocked.
  entitlements: async () => ({ plan: 'self-hosted', removeBranding: true, analyticsDays: 30, analyticsExport: false, premium: false, customDomain: false }),
};
