// Dev-only: the studio loads and saves content/page.json through this route.
import fs from 'node:fs';
import { CONTENT_PATH } from '@/lib/content';
import { Page } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export function GET() {
  const raw = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
  const parsed = Page.safeParse(raw);
  return Response.json({ page: parsed.success ? parsed.data : raw, valid: parsed.success, error: parsed.success ? null : parsed.error.issues, mtime: fs.statSync(CONTENT_PATH).mtimeMs });
}

export async function PUT(req: Request) {
  // Compare-and-set: refuse to overwrite a file that changed since the studio last saw it (e.g. an agent edited it).
  const base = Number(req.headers.get('x-base-mtime') || 0);
  const current = fs.statSync(CONTENT_PATH).mtimeMs;
  if (base && Math.abs(current - base) > 1) return Response.json({ error: 'conflict', mtime: current }, { status: 409 });
  const parsed = Page.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.issues }, { status: 400 });
  const { $schema, ...rest } = parsed.data;
  const body = JSON.stringify({ $schema: $schema ?? '../schema/page.schema.json', ...rest }, null, 2) + '\n';
  fs.writeFileSync(CONTENT_PATH, body);
  return Response.json({ ok: true, mtime: fs.statSync(CONTENT_PATH).mtimeMs });
}
