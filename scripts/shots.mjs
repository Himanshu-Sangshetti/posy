// Silent design review screenshots (system Chrome, headless, muted).
import { chromium } from '@playwright/test';
const base = process.env.URL || 'http://localhost:3210';
const out = process.env.OUT || '/tmp/posy-shots';
const paths = (process.env.PATHS || '/').split(',');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
for (const [name, vp] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const file = `${out}/${(p.replace(/\W+/g, '_') || 'home')}-${name}.png`;
    await page.screenshot({ path: file, fullPage: process.env.FULL !== '0' });
    console.log(file);
  }
  await page.close();
}
await browser.close();
