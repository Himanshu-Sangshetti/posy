import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '@/lib/uploads';
import { siteUrl } from '@/lib/site';

type Sharp = typeof import('sharp').default;
let sharpP: Promise<Sharp | null> | null = null;
// sharp ships with Next as an optional dependency; without it we can still use PNG/JPEG/GIF as-is.
const getSharp = () => (sharpP ??= import('sharp').then(m => (m.default ?? m) as unknown as Sharp).catch(() => null));

const SNIFF: [string, (b: Buffer) => boolean][] = [
  ['image/png', b => b[0] === 0x89 && b[1] === 0x50],
  ['image/jpeg', b => b[0] === 0xff && b[1] === 0xd8],
  ['image/gif', b => b.subarray(0, 3).toString() === 'GIF'],
];

async function readSource(src: string): Promise<Buffer | null> {
  if (src.startsWith('/') && !src.startsWith('//')) {
    const clean = decodeURIComponent(src.split('?')[0]);
    const file = clean.startsWith('/uploads/')
      ? path.resolve(UPLOAD_DIR, '.' + clean.slice('/uploads'.length))
      : path.resolve(process.cwd(), 'public', '.' + clean);
    const root = clean.startsWith('/uploads/') ? UPLOAD_DIR : path.resolve(process.cwd(), 'public');
    if (file.startsWith(root + path.sep)) {
      const local = await fs.readFile(file).catch(() => null);
      if (local) return local;
    }
    src = siteUrl() + src;
  }
  if (!/^https?:\/\//.test(src)) return null;
  const res = await fetch(src, { signal: AbortSignal.timeout(5000), headers: { Accept: 'image/png,image/jpeg,image/*' } }).catch(() => null);
  if (!res?.ok) return null;
  const len = Number(res.headers.get('content-length') ?? 0);
  if (len > 12 * 1024 * 1024) return null;
  return Buffer.from(await res.arrayBuffer());
}

/**
 * An image as a data URL Satori can draw, cropped to w×h (2x for crispness), or null if it can't be
 * loaded. Fetching ourselves means a slow or broken image never breaks the whole share card.
 */
export async function loadImage(src: string | undefined, w: number, h: number, opts: { gray?: boolean } = {}): Promise<string | null> {
  if (!src) return null;
  try {
    const buf = await readSource(src);
    if (!buf) return null;
    const sharp = await getSharp();
    if (sharp) {
      const img = sharp(buf).resize(Math.round(w * 2), Math.round(h * 2), { fit: 'cover' });
      const out = await (opts.gray ? img.grayscale().modulate({ brightness: 0.95 }).linear(1.15, -12) : img).jpeg({ quality: 82 }).toBuffer();
      return `data:image/jpeg;base64,${out.toString('base64')}`;
    }
    const type = SNIFF.find(([, test]) => test(buf))?.[0];
    return type ? `data:${type};base64,${buf.toString('base64')}` : null;
  } catch {
    return null;
  }
}

/** Round avatar crops keep transparency (favicons), so they stay PNG. */
export async function loadRoundable(src: string | undefined, size: number): Promise<string | null> {
  if (!src) return null;
  try {
    const buf = await readSource(src);
    if (!buf) return null;
    const sharp = await getSharp();
    if (sharp) return `data:image/png;base64,${(await sharp(buf).resize(size, size, { fit: 'cover' }).png().toBuffer()).toString('base64')}`;
    const type = SNIFF.find(([, test]) => test(buf))?.[0];
    return type ? `data:${type};base64,${buf.toString('base64')}` : null;
  } catch {
    return null;
  }
}
