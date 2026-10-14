import { authed, json } from '@/lib/api';
import { unfurl } from '@/lib/enrich';

/** Title, description and preview image for a link tile. */
export const GET = authed(async (_userId, req) => json(await unfurl(new URL(req.url).searchParams.get('url') ?? '')));
