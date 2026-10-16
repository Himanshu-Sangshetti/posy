import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';
import { clientIp, limit } from '@/lib/rate-limit';

const handler = toNextJsHandler(auth);

// [path suffix, max, window seconds] per client address, shared across instances. Generous on purpose: mobile carriers put
// many people behind one address. Social sign-in is left to the provider (Google checks the password, not us).
const LIMITS: [RegExp, number, number][] = [
  [/\/sign-in\/(email|username)$/, 30, 60],
  [/\/sign-up\//, 30, 600],
  [/\/oauth2\/register$/, 10, 3600],
  [/\/(change-password|change-email|request-password-reset)$/, 5, 600],
];

export const GET = handler.GET;

export async function POST(req: Request) {
  const path = new URL(req.url).pathname;
  const rule = LIMITS.find(([re]) => re.test(path));
  if (rule) {
    const blocked = await limit([`auth:${rule[0].source}:${clientIp(req)}`, rule[1], rule[2]]);
    if (blocked) return blocked;
  }
  return handler.POST(req);
}
