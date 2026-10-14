import { authed, json } from '@/lib/api';
import { unfurl, spotify } from '@/lib/enrich';

/** Title, description and preview image for a link tile (cover art and title for Spotify links). */
export const GET = authed(async (_userId, req) => {
  const url = new URL(req.url).searchParams.get('url') ?? '';
  return json((await spotify(url)) ?? await unfurl(url));
});
