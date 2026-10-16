import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR, MIME, sniffImage } from '@/lib/uploads';

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const file = path.resolve(UPLOAD_DIR, ...parts);
  if (!file.startsWith(UPLOAD_DIR + path.sep) || !fs.existsSync(file)) return new Response('Not found', { status: 404 });
  const body = fs.readFileSync(file);
  // Files stored before uploads were sniffed may not be images at all: serve only what the bytes prove.
  const type = sniffImage(body);
  if (!type || type !== MIME[path.extname(file).slice(1)]) return new Response('Not found', { status: 404 });
  return new Response(body, {
    headers: {
      'Content-Type': type, 'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox", 'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
