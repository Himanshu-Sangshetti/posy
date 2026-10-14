// Dev-only: saves an uploaded image into public/uploads and returns its path.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';
const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif' };

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'No file' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: `Unsupported type ${file.type}` }, { status: 415 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: 'Max 8 MB' }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const name = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12) + '.' + ext;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buf);
  return Response.json({ src: `/uploads/${name}` });
}
