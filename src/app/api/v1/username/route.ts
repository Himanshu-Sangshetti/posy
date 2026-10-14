import { checkUsername } from '@/lib/pages';

export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get('check') ?? '';
  return Response.json(await checkUsername(name));
}
