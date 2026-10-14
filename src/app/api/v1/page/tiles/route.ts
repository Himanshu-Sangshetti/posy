import { authed, json } from '@/lib/api';
import { addTile } from '@/lib/page-ops';

/** Add a tile. `{ "input": "https://…" }` auto-detects the type; or send a full `{ "tile": {…} }`. */
export const POST = authed(async (userId, req) => {
  const b = await req.json();
  const tile = await addTile(userId, b.tile ?? String(b.input ?? ''), { after: b.after, size: b.size, color: b.color });
  return json({ tile }, 201);
});
