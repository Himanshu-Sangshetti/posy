import { authed, json } from '@/lib/api';
import { unfurl, spotify, youtube } from '@/lib/enrich';
import { enforce } from '@/lib/rate-limit';

/** Title, description and preview image for a link tile (cover art and title for Spotify and YouTube links). */
export const GET = authed(async (userId, req) => {
  await enforce(`unfurl:${userId}`, 60, 60);
  const url = new URL(req.url).searchParams.get('url') ?? '';
  return json((await spotify(url)) ?? (await youtube(url)) ?? await unfurl(url));
});
