import { test, expect, type APIRequestContext } from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';

const SITE = process.env.POSY_TEST_SITE ?? 'http://localhost:3211';
const REDIRECT = 'http://127.0.0.1:53682/callback';
const PASSWORD = 'pastel-garden-42';

/** One JSON-RPC call to the hosted MCP server (Streamable HTTP; the reply is JSON or a single SSE event). */
async function rpc(request: APIRequestContext, token: string | null, method: string, params: object = {}, id = 1) {
  const res = await request.post('/api/mcp', {
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    data: { jsonrpc: '2.0', id, method, params },
  });
  const text = await res.text();
  const body = text.startsWith('{') ? text : text.split('\n').find(l => l.startsWith('data:'))?.slice(5).trim() ?? '{}';
  return { status: res.status(), headers: res.headers(), json: JSON.parse(body) };
}
const tool = async (request: APIRequestContext, token: string, name: string, args: object = {}) => {
  const r = await rpc(request, token, 'tools/call', { name, arguments: args }, 2);
  const text = r.json.result?.content?.[0]?.text ?? '';
  return { isError: !!r.json.result?.isError, text, data: (() => { try { return JSON.parse(text); } catch { return text; } })() };
};

async function signUp(request: APIRequestContext) {
  const id = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const email = `${id}@example.com`;
  const r = await request.post('/api/auth/sign-up/email', { data: { email, password: PASSWORD, name: 'Agent Person' }, headers: { origin: SITE } });
  expect(r.ok()).toBeTruthy();
  return { id, email };
}

test.describe('MCP with an API key', () => {
  test('every tool is annotated, and an agent can build and publish a page', async ({ request }) => {
    const { id } = await signUp(request);
    const k = await request.post('/api/auth/api-key/create', { data: { name: 'test' }, headers: { origin: SITE } });
    const key = (await k.json()).key as string;
    expect(key).toMatch(/^posy_/);

    const list = await rpc(request, key, 'tools/list');
    const tools = list.json.result.tools as { name: string; title?: string; annotations?: Record<string, unknown> }[];
    expect(tools.map(t => t.name)).toEqual(expect.arrayContaining(['get_page', 'create_page', 'add_tile', 'publish']));
    for (const t of tools) {
      expect(t.title, t.name).toBeTruthy();
      expect(t.annotations && ('readOnlyHint' in t.annotations || 'destructiveHint' in t.annotations), t.name).toBeTruthy();
    }

    const before = await tool(request, key, 'get_page');
    expect(before.text).toContain('create_page');
    const made = await tool(request, key, 'create_page', { username: id, style: 'minimal', empty: true });
    expect(made.isError).toBe(false);
    const added = await tool(request, key, 'add_tile', { inputs: ['https://github.com/octocat', 'octocat/Hello-World', 'hi@example.com', 'Open to work'] });
    expect(added.data.added).toHaveLength(4);
    const state = await tool(request, key, 'get_page');
    expect(state.data.page.tiles).toHaveLength(4);
    expect(state.data.next).toMatch(/publish/i);
    expect((await tool(request, key, 'publish')).isError).toBe(false);
    expect((await request.get(`/${id}`)).status()).toBe(200);
    expect((await tool(request, key, 'get_page')).data.next).toMatch(/published/i);
  });

  test('a bad bearer gets the OAuth challenge', async ({ request }) => {
    const r = await rpc(request, null, 'tools/list');
    expect(r.status).toBe(401);
    expect(r.headers['www-authenticate']).toContain('resource_metadata=');
    expect((await rpc(request, 'posy_nope', 'tools/list')).status).toBe(401);
    expect((await rpc(request, 'not.a.jwt', 'tools/list')).status).toBe(401);
  });
});

test.describe('OAuth contract', () => {
  test('metadata lines up and supports what claude.ai, ChatGPT and Cursor need', async ({ request }) => {
    const prm = await (await request.get('/.well-known/oauth-protected-resource/api/mcp')).json();
    expect(prm.resource).toBe(`${SITE}/api/mcp`);
    const issuer = prm.authorization_servers[0];
    const as = await (await request.get('/.well-known/oauth-authorization-server/api/auth')).json();
    expect(as.issuer).toBe(issuer);
    expect(as.code_challenge_methods_supported).toContain('S256');
    expect(as.registration_endpoint).toBeTruthy();
    expect(as.client_id_metadata_document_supported).toBe(true);
    expect(as.token_endpoint_auth_methods_supported).toContain('none');
    expect((await request.get('/.well-known/openid-configuration/api/auth')).ok()).toBeTruthy();
  });
});

test('OAuth end to end: register, log in, allow, token, call a tool, refresh', async ({ page, request, playwright }) => {
  const { id, email } = await signUp(request);
  // Real MCP clients carry no cookies, so talk to the server from a clean context (the browser also starts logged out).
  const anon = await playwright.request.newContext({ baseURL: SITE });
  const reg = await anon.post('/api/auth/oauth2/register', {
    data: { client_name: 'Test connector', redirect_uris: [REDIRECT], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], scope: 'openid profile email offline_access page:write' },
  });
  expect(reg.ok(), await reg.text()).toBeTruthy();
  const clientId = (await reg.json()).client_id as string;

  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(8).toString('hex');
  const auth = new URL(`${SITE}/api/auth/oauth2/authorize`);
  Object.entries({ response_type: 'code', client_id: clientId, redirect_uri: REDIRECT, scope: 'openid profile email offline_access page:write', state, code_challenge: challenge, code_challenge_method: 'S256', resource: `${SITE}/api/mcp` })
    .forEach(([k, v]) => auth.searchParams.set(k, v));

  let callback = '';
  await page.route(`${REDIRECT}**`, route => { callback = route.request().url(); return route.fulfill({ status: 200, body: 'ok' }); });
  await page.goto(auth.toString());
  await page.waitForURL(/\/login/);
  await page.fill('#email', email);
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(/oauth\/consent/);
  await expect(page.getByRole('heading', { name: /Allow/ })).toContainText('Test connector');
  await page.getByRole('button', { name: 'Allow' }).click();
  await expect.poll(() => callback, { timeout: 15_000 }).toContain('code=');
  const cb = new URL(callback);
  expect(cb.searchParams.get('state')).toBe(state);

  const token = await anon.post('/api/auth/oauth2/token', {
    form: { grant_type: 'authorization_code', code: cb.searchParams.get('code')!, redirect_uri: REDIRECT, client_id: clientId, code_verifier: verifier, resource: `${SITE}/api/mcp` },
  });
  expect(token.ok(), await token.text()).toBeTruthy();
  const tok = await token.json();
  expect(tok.access_token).toBeTruthy();
  expect(tok.refresh_token).toBeTruthy();

  // the OAuth token drives the same tools as an API key
  const made = await tool(anon, tok.access_token, 'create_page', { username: id, empty: true });
  expect(made.isError, made.text).toBe(false);
  expect((await tool(anon, tok.access_token, 'add_tile', { input: 'https://github.com/octocat' })).isError).toBe(false);
  expect((await rpc(anon, `${tok.access_token}x`, 'tools/list')).status).toBe(401);

  const refreshed = await anon.post('/api/auth/oauth2/token', { form: { grant_type: 'refresh_token', refresh_token: tok.refresh_token, client_id: clientId, resource: `${SITE}/api/mcp` } });
  expect(refreshed.ok(), await refreshed.text()).toBeTruthy();
  const next = await refreshed.json();
  expect((await tool(anon, next.access_token, 'get_page')).isError).toBe(false);
});

test.describe('the Posy page file', () => {
  test('docs, schema, openapi and llms.txt are public and point at each other', async ({ request }) => {
    const llms = await (await request.get('/llms.txt')).text();
    expect(llms).toContain('/new#p=');
    expect(llms).toContain('/docs/agents');
    expect(llms).not.toContain(`${SITE}/agents`); // that is the login-gated dashboard tab
    for (const p of ['/docs/agents', '/docs/format', '/llms-full.txt', '/openapi.json', '/schema/brief.schema.json', '/schema/page.schema.json']) {
      expect((await request.get(p)).status(), p).toBe(200);
    }
    expect((await (await request.get('/openapi.json')).json()).openapi).toBe('3.1.0');
    expect((await (await request.get('/schema/brief.schema.json')).json()).properties.links).toBeTruthy();
    expect(await (await request.get('/docs/format')).text()).toContain('Copy a prompt for your chat');
  });

  test('paste a chat reply on /new, preview it, sign up, and the page is waiting', async ({ page }) => {
    const id = `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;
    const reply = 'Sure! Here is your page:\n```json\n' + JSON.stringify({ posy: 1, name: 'Fiona File', bio: 'Made in a chat', links: [{ heading: 'Find me' }, 'https://github.com/octocat', 'hi@example.com', { text: 'Open for work' }] }, null, 2) + '\n```';
    await page.goto('/new');
    await page.getByLabel('Paste the chat’s reply here').fill('nonsense');
    await expect(page.locator('p[role=alert]')).toContainText('JSON');
    await page.getByLabel('Paste the chat’s reply here').fill(reply);
    await expect(page.getByText('Fiona File').first()).toBeVisible();
    await page.getByLabel('Your address').fill(id);
    await page.getByRole('button', { name: 'Make it mine' }).click();
    await page.waitForURL(/signup\?draft=1/);
    await page.fill('#name', 'Fiona File');
    await page.fill('#email', `${id}@example.com`);
    await page.fill('#password', 'pastel-garden-42');
    await page.click('button[type=submit]');
    await page.waitForURL(/\/new\?finish=1/);
    await expect(page.getByLabel('Your address')).toHaveValue(id);
    await page.getByRole('button', { name: 'Create my page' }).click();
    await page.waitForURL(/\/edit/);
    const d = await (await page.request.get('/api/v1/page')).json();
    expect(d.username).toBe(id);
    expect(d.page.profile.name).toBe('Fiona File');
    expect(d.page.tiles.map((t: { type: string }) => t.type)).toEqual(['heading', 'social', 'social', 'text']);
  });

  test('the import API and MCP tool create a page from a file, and refuse to overwrite without replace', async ({ request }) => {
    const { id } = await signUp(request);
    const key = (await (await request.post('/api/auth/api-key/create', { data: { name: 't' }, headers: { origin: SITE } })).json()).key as string;
    const file = { name: 'Ida Import', username: id, links: ['https://github.com/octocat', 'ida/atlas'] };
    const made = await tool(request, key, 'import_page', { file });
    expect(made.isError, made.text).toBe(false);
    expect(made.data.created).toBe(true);
    expect((await tool(request, key, 'get_page')).data.page.tiles).toHaveLength(2);
    const again = await tool(request, key, 'import_page', { file });
    expect(again.isError).toBe(true);
    expect(again.text).toContain('replace');
    expect((await tool(request, key, 'import_page', { file: { name: 'Ida Two', links: ['hi@example.com'] }, replace: true })).isError).toBe(false);
    expect((await tool(request, key, 'get_page')).data.page.profile.name).toBe('Ida Two');
    const bad = await request.post('/api/v1/page/import', { headers: { authorization: `Bearer ${key}` }, data: { file: 'not json' } });
    expect(bad.status()).toBe(400);
  });
});

test('a brand-new user can sign up in the middle of connecting an AI app', async ({ page, playwright }) => {
  const anon = await playwright.request.newContext({ baseURL: SITE });
  const reg = await anon.post('/api/auth/oauth2/register', { data: { client_name: 'Fresh connector', redirect_uris: [REDIRECT], token_endpoint_auth_method: 'none', grant_types: ['authorization_code'], response_types: ['code'] } });
  const clientId = (await reg.json()).client_id as string;
  const auth = new URL(`${SITE}/api/auth/oauth2/authorize`);
  const challenge = createHash('sha256').update('v'.repeat(43)).digest('base64url');
  Object.entries({ response_type: 'code', client_id: clientId, redirect_uri: REDIRECT, scope: 'openid profile email page:write', state: 's', code_challenge: challenge, code_challenge_method: 'S256', resource: `${SITE}/api/mcp` }).forEach(([k, v]) => auth.searchParams.set(k, v));
  let callback = '';
  await page.route(`${REDIRECT}**`, route => { callback = route.request().url(); return route.fulfill({ status: 200, body: 'ok' }); });
  await page.goto(auth.toString());
  await page.waitForURL(/\/login/);
  await page.getByRole('link', { name: 'Make your page' }).click();
  await page.waitForURL(/\/signup/);
  const id = `n${Date.now().toString(36)}`;
  await page.fill('#name', 'New Person');
  await page.fill('#email', `${id}@example.com`);
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(/oauth\/consent/);
  await page.getByRole('button', { name: 'Allow' }).click();
  await expect.poll(() => callback, { timeout: 15_000 }).toContain('code=');
});
