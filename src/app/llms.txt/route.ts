import { siteUrl } from '@/lib/site';

export function GET() {
  const s = siteUrl();
  return new Response(`# Posy

> Posy is an open-source link-in-bio page builder. Every page is one JSON document with a public schema.

## For AI agents
- Edit a user's page with the MCP server at ${s}/api/mcp (Authorization: Bearer <the user's posy_ API key>).
- REST: GET/PUT ${s}/api/v1/page, POST ${s}/api/v1/page/tiles, POST ${s}/api/v1/page/publish.
- Read any published page: ${s}/api/v1/public/<username> (JSON) or ${s}/<username>/llms.txt (Markdown).
- Page format: ${s}/schema/page.schema.json

## Docs
- Agent guide: ${s}/agents
- Source: https://github.com/Himanshu-Sangshetti/posy
`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
