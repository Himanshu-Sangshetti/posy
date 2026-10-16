import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR } from './data-dir';

export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/avif': 'avif' };
export const MIME = Object.fromEntries(Object.entries(TYPES).map(([m, e]) => [e, m]));

const ascii = (b: Buffer, from: number, to: number) => b.subarray(from, to).toString('latin1');

/** The image type the bytes actually are (the browser's declared type is not trusted). */
export function sniffImage(b: Buffer): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0x89 && ascii(b, 1, 8) === 'PNG\r\n\x1a\n') return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (ascii(b, 0, 6) === 'GIF87a' || ascii(b, 0, 6) === 'GIF89a') return 'image/gif';
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return 'image/webp';
  if (ascii(b, 4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(b, 8, 12))) return 'image/avif';
  return null;
}

/** A header alone can be faked: when sharp is installed, the whole image must decode. */
async function decodes(buf: Buffer) {
  const sharp = await import('sharp').then(m => m.default).catch(() => null);
  if (!sharp) return true;
  return sharp(buf).stats().then(() => true, () => false);
}

/** Store an image: Vercel Blob when configured, otherwise .data/uploads (served by /uploads/…). */
export async function storeUpload(userId: string, file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024) throw new Error('Images can be up to 8 MB');
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImage(buf);
  if (!type || !(await decodes(buf))) throw new Error('Use a JPG, PNG, WebP, GIF or AVIF image');
  const name = `${crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16)}.${TYPES[type]}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    return (await put(`u/${userId}/${name}`, buf, { access: 'public', contentType: type, addRandomSuffix: false, allowOverwrite: true })).url;
  }
  const dir = path.join(UPLOAD_DIR, userId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), buf);
  return `/uploads/${userId}/${name}`;
}

/** Remove every file a user uploaded (account deletion). Best effort. */
export async function deleteUploads(userId: string) {
  if (!/^[\w-]+$/.test(userId)) return;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { list, del } = await import('@vercel/blob');
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: `u/${userId}/`, cursor, limit: 1000 });
      if (page.blobs.length) await del(page.blobs.map(b => b.url));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }
  fs.rmSync(path.join(UPLOAD_DIR, userId), { recursive: true, force: true });
}
