import { test, expect } from '@playwright/test';
import { newUser, draft, saved } from './helpers';

const HUMAN_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

test('sign up, claim a name and land in the editor', async ({ page }) => {
  const u = await newUser(page, 'links');
  const d = await draft(page);
  expect(d.username).toBe(u);
  expect(d.page.theme.layout).toBe('list');
});

test('paste a link to add a tile', async ({ page }) => {
  await newUser(page, 'blank');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByPlaceholder('Paste a link, an email, or write a note').fill('https://github.com/octocat');
  await page.keyboard.press('Enter');
  await saved(page);
  await expect.poll(async () => (await draft(page)).page.tiles.map((t: { platform?: string }) => t.platform)).toContain('github');
  // paste anywhere on the page
  await page.mouse.click(8, 300);
  await page.evaluate(() => {
    const dt = new DataTransfer(); dt.setData('text/plain', 'https://youtu.be/dQw4w9WgXcQ');
    window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt }));
  });
  await expect.poll(async () => (await draft(page)).page.tiles.map((t: { type: string }) => t.type)).toContain('video');
});

test('design changes save to the draft', async ({ page }) => {
  await newUser(page);
  await page.getByRole('button', { name: 'Design' }).click();
  await page.getByRole('button', { name: 'Glass' }).click();
  await page.getByRole('tab', { name: 'Colour' }).click();
  await page.getByRole('button', { name: 'Ink', exact: true }).click();
  await page.getByRole('tab', { name: 'Backdrop' }).click();
  await page.getByRole('button', { name: 'Dots' }).click();
  await page.getByRole('tab', { name: 'Type' }).click();
  await page.getByRole('button', { name: 'Modern font' }).click();
  await saved(page);
  await expect.poll(async () => (await draft(page)).page.theme).toMatchObject({ preset: 'ink', background: { style: 'dots' }, tileStyle: 'glass', font: 'modern' });
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('drafts stay private until you publish', async ({ page, browser }) => {
  const u = await newUser(page);
  await page.getByLabel('Bio').fill('A brand new bio');
  await saved(page);
  const visitor = await browser.newPage();
  await visitor.goto(`/${u}`);
  await expect(visitor.getByText('A brand new bio')).toHaveCount(0);
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Your page is live')).toBeVisible();
  await visitor.reload();
  await expect(visitor.getByText('A brand new bio')).toBeVisible();
});

test('an agent edits the page with an API key and the editor updates live', async ({ page, request }) => {
  await newUser(page);
  const key = (await page.request.post('/api/auth/api-key/create', { data: { name: 'test' }, headers: { Origin: 'http://localhost:3211' } }).then(r => r.json())).key;
  expect(key).toMatch(/^posy_/);
  const r = await request.post('/api/v1/page/tiles', { headers: { Authorization: `Bearer ${key}` }, data: { input: 'Added by my agent' } });
  expect(r.status()).toBe(201);
  await expect(page.getByText('Added by my agent')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Updated from your agent')).toBeVisible();
  const bad = await request.get('/api/v1/page', { headers: { Authorization: 'Bearer posy_wrong' } });
  expect(bad.status()).toBe(401);
});

test('visits show up in analytics', async ({ page, browser }) => {
  const u = await newUser(page); // a new page is live from the start
  const ctx = await browser.newContext({ userAgent: HUMAN_UA });
  const v = await ctx.newPage();
  await v.goto(`/${u}`);
  await v.waitForTimeout(800);
  await ctx.close();
  await page.goto('/analytics');
  await expect(page.getByText('Visits', { exact: true }).locator('xpath=..')).toContainText('1');
  const csv = await page.request.get('/api/v1/analytics/export');
  if (csv.status() === 402) { expect((await csv.json()).error).toContain('Pro'); return; } // hosted Free plan
  expect(csv.status()).toBe(200);
  expect(csv.headers()['content-type']).toContain('text/csv');
  expect(await csv.text()).toContain('date,views,clicks');
});

test('changing your username moves the page', async ({ page }) => {
  const u = await newUser(page);
  await page.goto('/settings');
  const next = `${u}x`;
  await page.getByLabel('Username').fill(next);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  expect((await page.request.get(`/${next}`)).status()).toBe(200);
  expect((await page.request.get(`/${u}`)).status()).toBe(404);
});

test('public page extras: llms.txt, JSON and share image', async ({ page }) => {
  const u = await newUser(page);
  expect(await (await page.request.get(`/${u}/llms.txt`)).text()).toContain('# Test Person');
  expect((await (await page.request.get(`/api/v1/public/${u}`)).json()).username).toBe(u);
  const og = await page.request.get(`/${u}/og.png`);
  expect(og.headers()['content-type']).toContain('image/png');
  const icon = await page.request.get(`/${u}/favicon.png`);
  expect(icon.headers()['content-type']).toContain('image/png');
});

test('the hosted MCP server lets an agent edit and publish with an API key', async ({ page, request }) => {
  const username = await newUser(page);
  const key = (await page.request.post('/api/auth/api-key/create', { data: { name: 'mcp' }, headers: { Origin: 'http://localhost:3211' } }).then(r => r.json())).key;
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
  let id = 0;
  const rpc = async (method: string, params: unknown = {}) => {
    const res = await request.post('/api/mcp', { headers, data: { jsonrpc: '2.0', id: ++id, method, params } });
    expect(res.status()).toBe(200);
    const body = await res.text();
    const line = body.split('\n').find(l => l.startsWith('data:'));
    return JSON.parse(line ? line.slice(5) : body);
  };
  const call = async (name: string, args: unknown = {}) => {
    const r = await rpc('tools/call', { name, arguments: args });
    expect(r.result.isError).toBeFalsy();
    return r.result.content[0].text as string;
  };

  const anon = await request.post('/api/mcp', { headers: { ...headers, Authorization: 'Bearer posy_wrong' }, data: { jsonrpc: '2.0', id: 99, method: 'tools/list' } });
  expect(anon.status()).toBe(401);

  const tools = (await rpc('tools/list')).result.tools.map((t: { name: string }) => t.name);
  expect(tools).toEqual(expect.arrayContaining(['get_page', 'add_tile', 'update_tile', 'remove_tile', 'move_tile', 'set_theme', 'set_profile', 'publish']));

  await call('set_profile', { bio: 'Edited over MCP' });
  await call('add_tile', { input: 'Hello from MCP' });
  await call('set_theme', { preset: 'lavender' });
  const state = JSON.parse(await call('get_page'));
  expect(JSON.stringify(state)).toContain('Hello from MCP');
  await call('publish');

  const visitor = await page.context().browser()!.newPage();
  await visitor.goto(`http://localhost:3211/${username}`);
  await expect(visitor.getByText('Edited over MCP')).toBeVisible();
  await expect(visitor.getByText('Hello from MCP')).toBeVisible();
  await visitor.close();
});

test('export your page and delete your account', async ({ page }) => {
  const u = await newUser(page);
  await page.goto('/settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download page.json' }).click();
  const file = await download;
  const exported = JSON.parse(await (await import('node:fs/promises')).readFile((await file.path())!, 'utf8'));
  expect(exported.profile.name).toBe('Test Person');

  await page.getByRole('button', { name: 'Delete account' }).click();
  await page.getByPlaceholder('Your password').fill('pastel-garden-42');
  await page.getByRole('button', { name: 'Delete forever' }).click();
  await page.waitForURL(url => url.pathname === '/' || url.pathname === '/signup' || url.pathname === '/login');
  expect((await page.request.get(`/${u}`)).status()).toBe(404);
});

test('the desk template turns tiles into objects, and a note can become a stamp', async ({ page, browser }) => {
  const u = await newUser(page, 'desk');
  expect((await draft(page)).page.theme).toMatchObject({ style: 'cozy', layout: 'bento' });
  const note = page.locator('[data-tile]').filter({ hasText: 'Currently working on something new' });
  await note.click();
  await page.getByRole('button', { name: 'Round stamp' }).click();
  await saved(page);
  await expect.poll(async () => (await draft(page)).page.tiles.filter((t: { look?: string }) => t.look === 'stamp').length).toBe(2);
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Your page is live')).toBeVisible();
  const visitor = await browser.newPage();
  await visitor.goto(`/${u}`);
  await expect(visitor.locator('.dk-pol').first()).toBeVisible();
  await expect(visitor.locator('.dk-ring')).toHaveCount(2);
  await expect(visitor.locator('.dk-vinyl')).toBeVisible();
  await expect(visitor.locator('.dk-env')).toBeVisible();
  await expect(visitor.locator('.posy-social-row a')).toHaveCount(4);
  await visitor.close();
});

test('export page.json, then import it back into the draft', async ({ page }) => {
  await newUser(page, 'creator');
  const before = (await draft(page)).page;
  await page.goto('/settings');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download page.json' }).click();
  const file = await (await dl).path();

  // change the draft, then bring the exported one back
  await page.request.put('/api/v1/page', { data: { page: { ...before, profile: { ...before.profile, bio: 'Changed after export' } }, baseVersion: (await draft(page)).version } });
  await page.locator('input[type=file]').setInputFiles(file!);
  await page.getByRole('button', { name: 'Replace draft' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Imported into your draft' })).toBeVisible();
  expect((await draft(page)).page).toEqual(before);

  // a bad file explains itself and changes nothing
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"theme":{"preset":"nope"}}') });
  await page.getByRole('button', { name: 'Replace draft' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'theme.preset' })).toBeVisible();
  expect((await draft(page)).page).toEqual(before);
});

test('onboarding lets you choose style, layout and colours separately', async ({ page }) => {
  const username = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await page.goto(`/signup?username=${username}`);
  await page.fill('#name', 'Test Person');
  await page.fill('#email', `${username}@example.com`);
  await page.fill('#password', 'pastel-garden-42');
  await page.click('button[type=submit]');
  await page.waitForURL(/onboarding/);
  await expect(page.getByRole('status').filter({ hasText: 'Available' })).toBeVisible();
  await page.click('[data-style="minimal"]');
  await page.click('[data-layout="list"]');
  await page.click('[data-preset="stone"]');
  await expect(page.frameLocator('iframe[title="Live preview of your page"]').getByRole('heading', { name: 'Test Person' }).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Create my page' }).click();
  await page.waitForURL(/\/edit/);
  const { page: d } = await page.request.get('/api/v1/page').then(r => r.json());
  expect(d.theme.style).toBe('minimal');
  expect(d.theme.layout).toBe('list');
  expect(d.theme.preset).toBe('stone');
});

test('canvas layout: drag a tile anywhere and the position saves', async ({ page }) => {
  await newUser(page);
  await page.getByRole('button', { name: 'Design' }).click();
  await page.getByRole('tab', { name: 'Layout' }).click();
  await page.getByRole('button', { name: 'Canvas' }).click();
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await draft(page)).page.theme.layout).toBe('canvas');
  const tile = page.locator('[data-canvas-editor] > [data-tile]:not(.posy-cv-heading)').first();
  await tile.scrollIntoViewIfNeeded();
  const id = await tile.getAttribute('data-tile');
  const auto = await tile.evaluate(el => ({ x: +getComputedStyle(el).getPropertyValue('--x'), y: +getComputedStyle(el).getPropertyValue('--y') }));
  const box = (await tile.boundingBox())!;
  await page.mouse.move(box.x + 30, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 150, box.y + 110, { steps: 12 });
  await page.mouse.up();
  await saved(page);
  await expect.poll(async () => {
    const t = (await draft(page)).page.tiles.find((t: { id: string }) => t.id === id);
    return t?.pos && t.pos.x > auto.x + 40 && t.pos.y > auto.y + 20;
  }).toBe(true);
  // every other tile was pinned where it was shown, so nothing reflowed
  const tiles = (await draft(page)).page.tiles as { type: string; pos?: object }[];
  expect(tiles.filter(t => t.type !== 'social').every(t => t.pos)).toBe(true);
});
