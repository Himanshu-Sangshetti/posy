import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const UPLOAD_DIR = path.resolve('.data/uploads');
const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/avif': 'avif' };
export const MIME = Object.fromEntries(Object.entries(TYPES).map(([m, e]) => [e, m]));

/** Store an image: Vercel Blob when configured, otherwise .data/uploads (served by /uploads/…). */
export async function storeUpload(userId: string, file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error('Use a JPG, PNG, WebP, GIF or AVIF image');
  if (file.size > 8 * 1024 * 1024) throw new Error('Images can be up to 8 MB');
  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16)}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    return (await put(`u/${userId}/${name}`, buf, { access: 'public', contentType: file.type, addRandomSuffix: false, allowOverwrite: true })).url;
  }
  const dir = path.join(UPLOAD_DIR, userId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buf);
  return `/uploads/${userId}/${name}`;
}
