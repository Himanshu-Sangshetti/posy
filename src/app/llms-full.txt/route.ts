import fs from 'node:fs';
import path from 'node:path';
import { edition } from '@/edition';
import { ENTITY_DESCRIPTION } from '@/lib/meta';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

/** Everything an agent needs in one request: the connect guide, the page file format and the tool list. */
export function GET() {
  const s = siteUrl();
  const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), 'docs', f), 'utf8').replaceAll('YOUR-POSY', s.replace(/^https?:\/\//, ''));
  const facts = `# Posy: full guide for AI agents

Site: ${s}

${ENTITY_DESCRIPTION} Free and open source (MIT).

## Looks
Painted, Desk (\`cozy\`), Washi, Lofi, Cobalt and Night.
${edition.llms ? `\n${edition.llms}` : ''}
## Docs
- ${s}/docs/agents
- ${s}/docs/format
`;
  return new Response(`${facts}\n---\n\n${doc('connect.md')}\n\n---\n\n${doc('format.md')}\n`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
