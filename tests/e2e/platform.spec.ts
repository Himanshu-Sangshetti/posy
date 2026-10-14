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
  await page.getByRole('button', { name: 'Midnight' }).click();
  await page.getByRole('tab', { name: 'Backdrop' }).click();
  await page.getByRole('button', { name: 'Aurora' }).click();
  await page.getByRole('tab', { name: 'Tiles' }).click();
  await page.getByRole('button', { name: 'Glass' }).click();
  await page.getByRole('tab', { name: 'Type' }).click();
  await page.getByRole('button', { name: 'Modern font' }).click();
  await saved(page);
  await expect.poll(async () => (await draft(page)).page.theme).toMatchObject({ preset: 'midnight', background: { style: 'aurora' }, tileStyle: 'glass', font: 'modern' });
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
  await expect(page.getByText('Views', { exact: true }).locator('xpath=..')).toContainText('1');
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
});
