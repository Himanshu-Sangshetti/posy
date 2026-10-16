import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

const auth = [{ bearer: [] }, { oauth: ['page:write'] }];
const ok = (description: string) => ({ '200': { description } });
const body = (schema: object) => ({ required: true, content: { 'application/json': { schema } } });

const themeOp = {
  summary: 'Change theme settings (same fields as the MCP set_theme tool); send only what should change',
  description: 'Looks (style): cozy, washi, lofi, painted, cobalt, night. Returns the whole theme.',
  security: auth,
  requestBody: body({ type: 'object', properties: {
    style: { type: 'string', enum: ['cozy', 'washi', 'lofi', 'painted', 'cobalt', 'night'] }, preset: { type: 'string' }, accent: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
    font: { type: 'string' }, radius: { type: 'string' }, layout: { type: 'string', enum: ['bento', 'list', 'canvas'] }, align: { type: 'string' }, tileStyle: { type: 'string' }, effect: { type: 'string' },
    avatar: { type: 'string' }, photos: { type: 'string', enum: ['natural', 'mono', 'dither', 'ascii'] }, motion: { type: 'boolean' }, ambient: { type: 'boolean' },
    background: { type: 'object', properties: { style: { type: 'string' }, image: { type: 'string' }, dim: { type: 'number' }, blur: { type: 'number' }, grain: { type: 'boolean' }, color: { type: 'string' } } },
  } }),
  responses: { '200': { description: '{ theme }' }, '400': { description: 'Invalid input; the message says why' } },
};

/** OpenAPI 3.1 description of the REST API (the same operations the MCP server offers). */
export function GET() {
  const s = siteUrl();
  return Response.json({
    openapi: '3.1.0',
    info: { title: 'Posy API', version: '1', description: 'Make and edit a Posy link-in-bio page. Everything edits the draft until you call publish.' },
    servers: [{ url: s }],
    components: {
      securitySchemes: {
        bearer: { type: 'http', scheme: 'bearer', description: 'A "posy_…" API key from the dashboard' },
        oauth: { type: 'oauth2', flows: { authorizationCode: { authorizationUrl: `${s}/api/auth/oauth2/authorize`, tokenUrl: `${s}/api/auth/oauth2/token`, scopes: { 'page:write': 'Read and edit your page' } } } },
      },
    },
    paths: {
      '/api/v1/page': {
        get: { summary: 'Your page: draft, version, publish state', security: auth, responses: ok('The page') },
        put: { summary: 'Replace the draft (send baseVersion to avoid overwriting newer changes)', security: auth, requestBody: body({ type: 'object', properties: { page: { $ref: `${s}/schema/page.schema.json` }, baseVersion: { type: 'integer' } }, required: ['page'] }), responses: { ...ok('Saved'), '409': { description: 'The page changed since baseVersion' } } },
      },
      '/api/v1/claim': { post: { summary: 'Create your page (claim a username)', security: auth, requestBody: body({ type: 'object', properties: { username: { type: 'string' }, style: { type: 'string' }, layout: { type: 'string' }, preset: { type: 'string' }, empty: { type: 'boolean' } }, required: ['username'] }), responses: { '201': { description: 'Created' }, '409': { description: 'You already have a page' } } } },
      '/api/v1/page/import': { post: { summary: 'Load a Posy page file (brief or full page JSON)', description: `Format: ${s}/docs/format`, security: auth, requestBody: body({ type: 'object', properties: { file: { description: 'The brief as an object, or the raw text a chat produced' }, username: { type: 'string' }, replace: { type: 'boolean' } }, required: ['file'] }), responses: { '201': { description: 'Loaded' }, '400': { description: 'The file could not be read; the message says why' } } } },
      '/api/v1/page/tiles': { post: { summary: 'Add a tile from a link, email, owner/repo or note (auto-detected), or a full tile object', security: auth, requestBody: body({ type: 'object', properties: { input: { type: 'string' }, tile: { type: 'object' }, after: { type: 'string' }, size: { type: 'string' }, color: { type: 'string' } } }), responses: { '201': { description: 'Added' } } } },
      '/api/v1/page/theme': { patch: themeOp, post: themeOp },
      '/api/v1/page/publish': { post: { summary: 'Make the draft live', security: auth, responses: ok('Published') } },
      '/api/v1/public/{username}': { get: { summary: 'Read any published page as JSON', parameters: [{ name: 'username', in: 'path', required: true, schema: { type: 'string' } }], responses: ok('The published page') } },
      '/api/v1/username': { get: { summary: 'Check if a username is available', parameters: [{ name: 'check', in: 'query', required: true, schema: { type: 'string' } }], responses: ok('{ ok: boolean, reason?: string }') } },
    },
  }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
