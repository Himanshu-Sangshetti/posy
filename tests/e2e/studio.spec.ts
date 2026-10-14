import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

const FILE = '.scratch/e2e-page.json';
const saved = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const waitSaved = (p: Page) => expect(p.getByRole('status', { name: 'Saved' })).toBeVisible({ timeout: 8000 });

test.beforeEach(async ({ page }) => {
  fs.copyFileSync('content/page.json', FILE);
  await page.goto('/edit/');
  await expect(page.getByLabel('Name')).toHaveValue('Alex Rivera');
});

test('add a tile by pasting a link into Add', async ({ page }) => {
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByPlaceholder('Paste a link, an email, or write a note').fill('https://github.com/octocat');
  await page.keyboard.press('Enter');
  await waitSaved(page);
  await expect.poll(() => saved().tiles.some((t: { platform?: string; handle?: string }) => t.platform === 'github' && t.handle === 'octocat')).toBe(true);
});

test('paste anywhere adds a tile', async ({ page }) => {
  await page.mouse.click(10, 10);
  await page.evaluate(() => {
    const dt = new DataTransfer(); dt.setData('text/plain', 'https://youtu.be/dQw4w9WgXcQ');
    window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt }));
  });
  await waitSaved(page);
  await expect.poll(() => saved().tiles.some((t: { type: string }) => t.type === 'video')).toBe(true);
});

test('select, resize, recolour, edit text and delete', async ({ page }) => {
  const note = page.locator('[data-tile="t-note"]');
  await note.click();
  await page.getByRole('button', { name: 'Large', exact: true }).click();
  await page.getByRole('button', { name: 'Colour', exact: true }).click();
  await page.getByRole('button', { name: 'mint' }).click();
  await page.getByLabel('Note', { exact: true }).fill('Hello from the test');
  await waitSaved(page);
  await expect.poll(() => saved().tiles.find((t: { id: string }) => t.id === 't-note')).toMatchObject({ size: 'l', color: 'mint', text: 'Hello from the test' });
  await page.keyboard.press('Escape');
  await page.locator('[data-tile="t-ig"]').click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await waitSaved(page);
  await expect.poll(() => saved().tiles.some((t: { id: string }) => t.id === 't-ig')).toBe(false);
  // undo brings it back
  await page.mouse.click(10, 10);
  await page.keyboard.press('Meta+z');
  await waitSaved(page);
  await expect.poll(() => saved().tiles.some((t: { id: string }) => t.id === 't-ig')).toBe(true);
});

test('drag to reorder', async ({ page }) => {
  const before = saved().tiles.map((t: { id: string }) => t.id);
  const a = await page.locator('[data-tile="t-x"]').boundingBox();
  const b = await page.locator('[data-tile="t-ig"]').boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(a!.x + a!.width / 2 + 20, a!.y + a!.height / 2, { steps: 4 });
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, { steps: 12 });
  await page.mouse.up();
  await waitSaved(page);
  await expect.poll(() => saved().tiles.map((t: { id: string }) => t.id).indexOf('t-x')).toBeGreaterThan(before.indexOf('t-x'));
});

test('theme, font and layout', async ({ page }) => {
  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByRole('button', { name: 'Midnight' }).click();
  await page.getByRole('button', { name: /rounded/i }).click();
  await page.getByRole('button', { name: 'Centre' }).click();
  await waitSaved(page);
  await expect.poll(() => saved().theme).toMatchObject({ preset: 'midnight', font: 'rounded', layout: 'stack' });
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('profile edits save', async ({ page }) => {
  await page.getByLabel('Name').fill('Sam Test');
  await page.getByLabel('Bio').fill('Testing Posy');
  await waitSaved(page);
  await expect.poll(() => saved().profile).toMatchObject({ name: 'Sam Test', bio: 'Testing Posy' });
});

test('an agent editing page.json shows up live', async ({ page }) => {
  const data = saved();
  data.profile.name = 'Edited By Agent';
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  await expect(page.getByLabel('Name')).toHaveValue('Edited By Agent', { timeout: 6000 });
});

test('mobile preview', async ({ page }) => {
  await page.getByRole('button', { name: 'Mobile' }).click();
  await expect(page.locator('.posy-page')).toBeVisible();
  const w = await page.locator('.posy-page').evaluate(el => el.getBoundingClientRect().width);
  expect(w).toBeLessThanOrEqual(390);
});
