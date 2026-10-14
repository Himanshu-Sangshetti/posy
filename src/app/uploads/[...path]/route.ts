import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR, MIME } from '@/lib/uploads';

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const file = path.resolve(UPLOAD_DIR, ...parts);
  if (!file.startsWith(UPLOAD_DIR + path.sep) || !fs.existsSync(file)) return new Response('Not found', { status: 404 });
  const type = MIME[path.extname(file).slice(1)] ?? 'application/octet-stream';
  return new Response(fs.readFileSync(file), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
