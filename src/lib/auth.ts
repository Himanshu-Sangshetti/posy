import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { apiKey } from '@better-auth/api-key';
import { APIError } from 'better-auth/api';
import { count } from 'drizzle-orm';
import { db, schema } from '@/db';
import { edition } from '@/edition';

const env = process.env;

export const auth = betterAuth({
  appName: 'Posy',
  // Unset in development: Better Auth infers the URL from each request (any localhost port works).
  baseURL: env.BETTER_AUTH_URL || (env.NODE_ENV === 'production' ? env.NEXT_PUBLIC_SITE_URL : undefined),
  trustedOrigins: env.NODE_ENV === 'production' ? [] : ['http://localhost:*', 'http://127.0.0.1:*'],
  secret: env.BETTER_AUTH_SECRET || 'dev-only-secret-change-me-in-production-0123456789',
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  user: { deleteUser: { enabled: true } }, // pages and events cascade-delete with the user
  databaseHooks: {
    user: {
      create: {
        // Self-hosted instances belong to their first user unless POSY_SIGNUP=open.
        before: async () => {
          if (edition.signup === 'open') return;
          const [{ n }] = await db.select({ n: count() }).from(schema.user);
          if (edition.signup === 'closed' || n > 0) throw new APIError('FORBIDDEN', { message: 'Sign-ups are closed on this Posy. Ask the owner to set POSY_SIGNUP=open.' });
        },
      },
    },
  },
  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } } : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } } : {}),
  },
  plugins: [
    // Keys for AI agents and scripts: "Authorization: Bearer posy_…"
    apiKey({ defaultPrefix: 'posy_', enableSessionForAPIKeys: true, rateLimit: { enabled: true, timeWindow: 60_000, maxRequests: 120 } }),
    nextCookies(),
  ],
});

export const providers = {
  github: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
};
