import { authed, json } from '@/lib/api';
import { setTheme } from '@/lib/page-ops';

/** Change theme settings (look, palette, font, layout, photos, background …). Send only what should change; same fields as the MCP `set_theme` tool. */
const change = authed(async (userId, req) => {
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== 'object' || Array.isArray(b)) return json({ error: 'Send a JSON object, e.g. {"style":"night","preset":"..."}' }, 400);
  return json({ theme: await setTheme(userId, b) });
});

export const PATCH = change;
export const POST = change;
