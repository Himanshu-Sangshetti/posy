import { checkUsername, changeUsername } from '@/lib/pages';
import { authed, json } from '@/lib/api';
import { clientIp, enforce, limit } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const blocked = await limit([`username:${clientIp(req)}`, 240, 60]);
  if (blocked) return blocked;
  const name = new URL(req.url).searchParams.get('check') ?? '';
  return Response.json(await checkUsername(name));
}

/** Change your username. Old links stop working, so the UI asks first. */
export const PATCH = authed(async (userId, req) => {
  await enforce(`rename:${userId}`, 5, 3600);
  return json({ username: await changeUsername(userId, String((await req.json()).username ?? '')) });
});
