import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { apiKey } from '@better-auth/api-key';
import { jwt } from 'better-auth/plugins';
import { mcp } from '@better-auth/mcp';
import { cimd } from '@better-auth/cimd';
import { fetchClientMetadataResource } from '@better-auth/cimd/node';
import { APIError } from 'better-auth/api';
import { count } from 'drizzle-orm';
import { db, schema } from '@/db';
import { edition } from '@/edition';
import { siteUrl } from '@/lib/site';
import { track } from '@/lib/telemetry-events';
import { deleteUploads } from '@/lib/uploads';

const env = process.env;

export const auth = betterAuth({
  appName: 'Posy',
  // OAuth for AI apps needs one fixed public URL (issuer and resource), so set NEXT_PUBLIC_SITE_URL, also in development.
  // Without it, development still works for the web app: Better Auth infers the URL from each request.
  baseURL: env.BETTER_AUTH_URL || env.NEXT_PUBLIC_SITE_URL || siteUrl(),
  trustedOrigins: env.NODE_ENV === 'production' ? [] : ['http://localhost:*', 'http://127.0.0.1:*'],
  secret: env.BETTER_AUTH_SECRET || 'dev-only-secret-change-me-in-production-0123456789',
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  // Brute-force protection is on in production; the e2e suite signs up many users from one IP, so it switches this off.
  // Per-instance memory only: the shared database limiter in the auth route (lib/rate-limit) is what holds across instances.
  rateLimit: env.POSY_E2E || env.POSY_RATE_LIMIT === 'off' ? { enabled: false } : undefined,
  // Pages and events cascade-delete with the user; uploaded files are removed here.
  user: { deleteUser: { enabled: true, afterDelete: async u => { await deleteUploads(u.id).catch(() => {}); } } },
  databaseHooks: {
    user: {
      create: {
        // Self-hosted instances belong to their first user unless POSY_SIGNUP=open.
        before: async () => {
          if (edition.signup === 'open') return;
          const [{ n }] = await db.select({ n: count() }).from(schema.user);
          if (edition.signup === 'closed' || n > 0) throw new APIError('FORBIDDEN', { message: 'Sign-ups are closed on this Posy. Ask the owner to set POSY_SIGNUP=open.' });
        },
        after: async u => { track({ type: 'account.created', userId: u.id }); },
      },
    },
  },
  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } } : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } } : {}),
  },
  plugins: [
    // Keys for AI agents and scripts: "Authorization: Bearer posy_…". A key is never a login session: it opens the page
    // API (/api/v1) and MCP tools only, as far as its permissions allow (lib/session.ts keyAllows).
    apiKey({
      defaultPrefix: 'posy_',
      enableSessionForAPIKeys: false,
      permissions: { defaultPermissions: { page: ['read', 'write'] } },
      keyExpiration: { defaultExpiresIn: null, maxExpiresIn: 365 },
      rateLimit: { enabled: true, timeWindow: 60_000, maxRequests: 120 },
    }),
    // OAuth for AI apps (claude.ai, ChatGPT, Cursor ...): this server is the authorization server for /api/mcp.
    // The normal login page continues the flow, and /oauth/consent asks the user to allow the app.
    jwt(),
    mcp({
      loginPage: '/login',
      consentPage: '/oauth/consent',
      signup: { page: '/signup' },
      resource: `${siteUrl()}/api/mcp`,
      scopes: ['openid', 'profile', 'email', 'offline_access', 'page:write'],
      clientRegistrationDefaultScopes: ['openid', 'profile', 'email', 'offline_access', 'page:write'],
      clientRegistrationAllowedScopes: ['openid', 'profile', 'email', 'offline_access', 'page:write'],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      grantTypes: ['authorization_code', 'refresh_token'],
      clientRegistrationDefaultApplicationType: 'infer',
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: 'mcp-2026-07-28' }),
    nextCookies(),
  ],
});

export const providers = {
  github: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
};
