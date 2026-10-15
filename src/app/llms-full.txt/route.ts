import fs from 'node:fs';
import path from 'node:path';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

/** Everything an agent needs in one request: the connect guide, the page file format and the tool list. */
export function GET() {
  const s = siteUrl();
  const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), 'docs', f), 'utf8').replaceAll('YOUR-POSY', s.replace(/^https?:\/\//, ''));
  return new Response(`# Posy: full guide for AI agents\n\nSite: ${s}\n\n${doc('connect.md')}\n\n---\n\n${doc('format.md')}\n`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
