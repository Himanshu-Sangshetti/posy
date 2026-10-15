import { z } from 'zod';
import { Brief } from '@/lib/brief';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

/** JSON Schema for the Posy brief (see /docs/format). */
export function GET() {
  const schema = { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: `${siteUrl()}/schema/brief.schema.json`, ...z.toJSONSchema(Brief, { io: 'input' }) };
  return Response.json(schema, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
