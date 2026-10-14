import { authed, json } from '@/lib/api';
import { updateTile, removeTile, moveTile } from '@/lib/page-ops';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = authed<Ctx>(async (userId, req, { params }) => {
  const { id } = await params;
  const { position, ...patch } = await req.json();
  if (typeof position === 'number') await moveTile(userId, id, position);
  return json({ tile: Object.keys(patch).length ? await updateTile(userId, id, patch) : undefined, ok: true });
});

export const DELETE = authed<Ctx>(async (userId, _req, { params }) => {
  await removeTile(userId, (await params).id);
  return json({ ok: true });
});
