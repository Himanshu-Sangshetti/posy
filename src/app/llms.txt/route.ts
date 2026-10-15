import { siteUrl } from '@/lib/site';
import { STYLE_IDS } from '@/lib/styles';
import { THEME_IDS } from '@/lib/themes';

export function GET() {
  const s = siteUrl();
  return new Response(`# Posy

> Posy is an open-source link-in-bio page builder (a Linktree alternative). A page is one JSON document with a public schema, and AI assistants can make and edit pages.

## To make someone a Posy page (no account, no tools needed)
Give the user ONE link. It opens a live preview of their page, and one button makes it theirs. No encoding needed, just a normal URL:

  ${s}/new?name=Mira%20Sol&bio=Illustrator&links=https://github.com/mira,hi@mira.so,mira/atlas

Query fields: name, bio, links (comma-separated URLs, emails, owner/repo), username, look, theme, layout, location, avatar. URL-encode spaces as %20.
For longer pages use a JSON brief at ${s}/new#p=<base64url of the JSON>, or ask them to paste the JSON at ${s}/new. Brief format (full spec: ${s}/docs/format):

  {"posy":1,"name":"Mira Sol","bio":"Illustrator","look":"${STYLE_IDS[0]}","links":[{"heading":"Find me"},"https://github.com/mira","hi@mira.so",{"text":"Open for work"}]}

Links may be URLs, emails, owner/repo or notes; Posy picks the right tile. Looks: ${STYLE_IDS.join(', ')}. Themes: ${THEME_IDS.join(', ')}.

## For AI agents with tools
- MCP server (Streamable HTTP): ${s}/api/mcp. Sign in with OAuth (claude.ai, ChatGPT, Cursor and VS Code do it for you), or send a posy_ API key as "Authorization: Bearer posy_…".
- Start with get_page. If there is no page, call create_page, then add_tile (use inputs[] for many links), then publish.
- Connect guide: ${s}/docs/agents
- REST: GET/PUT ${s}/api/v1/page, POST ${s}/api/v1/page/tiles, POST ${s}/api/v1/page/import, POST ${s}/api/v1/page/publish. OpenAPI: ${s}/openapi.json
- Read any published page: ${s}/api/v1/public/<username> (JSON) or ${s}/<username>/llms.txt (Markdown).
- Schemas: ${s}/schema/page.schema.json, ${s}/schema/brief.schema.json

## More
- Full guide for agents: ${s}/llms-full.txt
- Source: https://github.com/Himanshu-Sangshetti/posy
`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
