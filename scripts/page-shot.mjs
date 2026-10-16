// node .scratch/full.mjs <style> <set> [width] [preset] -> .scratch/shots/full-<style>-<set>-<w>.png, stitched from viewport shots (full-page capture breaks the scenes)
import { chromium } from '@playwright/test';
import sharp from 'sharp';
const [style, set = 'rich', w = '1440', preset = ''] = process.argv.slice(2);
const W = +w, VH = W < 600 ? 844 : 900;
const b = await chromium.launch({ channel: 'chrome', args: ['--mute-audio'] });
const p = await (await b.newContext({ viewport: { width: W, height: VH }, deviceScaleFactor: 1, isMobile: W < 600, hasTouch: W < 600 })).newPage();
const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
await p.goto(`http://localhost:3200/lab/page/${style}?set=${set}${preset ? '&preset=' + preset : ''}`, { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(6000);
await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
const H = Math.min(6000, await p.evaluate(() => document.documentElement.scrollHeight));
const parts = [];
for (let y = 0; y < H; y += VH) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(1800); const at = await p.evaluate(() => scrollY); parts.push({ input: await p.screenshot(), top: at, left: 0 }); }
const out = `.scratch/shots/full-${style}-${set}-${w}${preset ? '-' + preset : ''}.png`;
await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } }).composite(parts).png().toFile(out);
console.log(out, H, 'errors', errs); await b.close();
