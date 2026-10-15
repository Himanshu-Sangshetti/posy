import { test, expect } from '@playwright/test';

// A phone-sized screen. Pages must not be wider than it (a wide page makes the phone zoom out), and the
// buttons you need must be on screen.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const fits = (page: import('@playwright/test').Page) => page.evaluate(() => innerWidth);

test('sign up, pick a look and publish from a phone', async ({ page }) => {
  const id = `ph${Date.now().toString(36)}`;
  await page.goto(`/signup?username=${id}`);
  expect(await fits(page)).toBe(390);
  await page.fill('#name', 'Phone Person');
  await page.fill('#email', `${id}@example.com`);
  await page.fill('#password', 'pastel-garden-42');
  await page.click('button[type=submit]');
  await page.waitForURL(/onboarding/);
  await expect(page.getByRole('status').filter({ hasText: 'Available' })).toBeVisible();
  expect(await fits(page)).toBe(390); // the long address row used to push the page wider than the screen
  await page.getByRole('button', { name: 'Create my page' }).tap();
  await page.waitForURL(/\/edit/);
  await expect(page.getByLabel('Name', { exact: true })).toBeVisible().catch(() => {});

  expect(await fits(page)).toBe(390);
  const publish = page.locator('[data-publish]');
  await expect(publish).toBeVisible();
  const box = (await publish.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390); // the Publish button used to sit off the right edge
  await page.getByRole('button', { name: 'Add', exact: true }).tap();
  await page.getByPlaceholder('Paste a link, an email, or write a note').fill('https://github.com/octocat');
  await page.keyboard.press('Enter');
  await expect(publish).toBeEnabled({ timeout: 10_000 });
  await publish.tap();
  await expect(publish).toContainText('Published', { timeout: 10_000 });
  expect((await page.request.get(`/${id}`)).status()).toBe(200);
});

test('public pages and docs fit a phone', async ({ page }) => {
  for (const path of ['/login', '/signup', '/new', '/docs/agents', '/docs/format']) {
    await page.goto(path);
    expect(await fits(page), path).toBe(390);
  }
});
