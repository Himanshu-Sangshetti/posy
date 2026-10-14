import { checkUsername, changeUsername } from '@/lib/pages';
import { authed, json } from '@/lib/api';

export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('check') ?? '';
  return Response.json(await checkUsername(name));
}

/** Change your username. Old links stop working, so the UI asks first. */
export const PATCH = authed(async (userId, req) => json({ username: await changeUsername(userId, String((await req.json()).username ?? '')) }));
