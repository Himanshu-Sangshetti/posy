import { expect, type Page } from '@playwright/test';

/** Sign up a fresh user, claim a username from a template, land in the editor. */
export async function newUser(page: Page, template: 'desk' | 'writer' | 'night' | 'creator' | 'developer' | 'links' | 'blank' = 'creator') {
  const username = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  await page.goto(`/signup?username=${username}`);
  await page.fill('#name', 'Test Person');
  await page.fill('#email', `${username}@example.com`);
  await page.fill('#password', 'pastel-garden-42');
  await page.click('button[type=submit]');
  await page.waitForURL(/onboarding/);
  await expect(page.getByRole('status').filter({ hasText: 'Available' })).toBeVisible();
  await page.click(`[data-tpl="${template === 'links' || template === 'blank' ? 'creator' : template}"]`);
  if (template === 'links') await page.click('[data-layout="list"]');
  if (template === 'blank') await page.check('[data-empty]');
  await page.getByRole('button', { name: 'Create my page' }).click();
  await page.waitForURL(/\/edit/);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Test Person');
  return username;
}

export async function draft(page: Page) {
  return (await page.request.get('/api/v1/page')).json();
}

export const saved = (page: Page) => expect(page.getByRole('status', { name: /Unpublished changes|Live/ })).toBeVisible({ timeout: 10_000 });
