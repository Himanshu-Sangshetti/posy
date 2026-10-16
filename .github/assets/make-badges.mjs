// Renders the "add Posy to your AI" badges in .github/assets/badges/ (light and dark).
// Usage: node .github/assets/make-badges.mjs   (needs Chrome, Playwright and Geist in POSY_FONTS)
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const out = join(here, 'badges');
const fonts = process.env.POSY_FONTS ?? join(root, '.scratch/readme/fonts');

const simple = (name, version = '') => `https://cdn.jsdelivr.net/npm/simple-icons${version}/icons/${name}.svg`;

// kind: "install" is a real one-click link, "setup" opens the docs.
const BADGES = [
  { id: 'cursor', label: 'Cursor', verb: 'Add to', kind: 'install', logo: simple('cursor') },
  { id: 'vscode', label: 'VS Code', verb: 'Install in', kind: 'install', logo: simple('visualstudiocode', '@11'), color: '#3ea6ff' },
  { id: 'vscode-insiders', label: 'VS Code Insiders', verb: 'Install in', kind: 'install', logo: simple('visualstudiocode', '@11'), color: '#24bfa5' },
  { id: 'claude', label: 'Claude', verb: 'Add to', kind: 'install', logo: simple('claude'), color: '#d97757' },
  { id: 'goose', label: 'Goose', verb: 'Install in', kind: 'install', logo: 'https://goose-docs.ai/img/goose-logo-black.png', crop: true },
  { id: 'chatgpt', label: 'ChatGPT', verb: 'Set up', kind: 'setup', logo: simple('openai', '@11') },
  { id: 'claude-code', label: 'Claude Code', verb: 'Set up', kind: 'setup', logo: simple('claude'), color: '#d97757' },
  { id: 'codex', label: 'Codex', verb: 'Set up', kind: 'setup', logo: simple('openai', '@11') },
];

async function logoMarkup(b) {
  const res = await fetch(b.logo);
  if (!res.ok) throw new Error(`${b.logo}: ${res.status}`);
  if (b.logo.endsWith('.svg')) {
    const svg = await res.text();
    return svg.replace(/fill="[^"]*"/g, '').replace('<svg', '<svg class="logo" fill="currentColor"');
  }
  const data = Buffer.from(await res.arrayBuffer()).toString('base64');
  return `<span class="logo png" style="--src:url(data:image/png;base64,${data})"></span>`;
}

const css = (dark) => {
  const ink = '#2b2621', cream = '#fcf2e4';
  const fg = dark ? ink : cream, bg = dark ? cream : ink, edge = dark ? 'rgba(252,242,228,.45)' : 'rgba(43,38,33,.35)';
  const text = dark ? cream : ink;
  return `
  @font-face { font-family: Geist; src: url(file://${fonts}/Geist-Medium.ttf); font-weight: 500; }
  @font-face { font-family: Geist; src: url(file://${fonts}/Geist-SemiBold.ttf); font-weight: 600; }
  body { margin: 0; padding: 20px; background: transparent; display: flex; flex-wrap: wrap; gap: 12px; }
  .b { display: inline-flex; align-items: center; gap: 9px; height: 40px; padding: 0 16px 0 13px; border-radius: 11px;
       font: 500 14.5px/1 Geist, sans-serif; letter-spacing: -0.005em; white-space: nowrap; box-sizing: border-box; }
  .install { background: ${bg}; color: ${fg}; }
  .setup { background: transparent; color: ${text}; box-shadow: inset 0 0 0 1.5px ${edge}; }
  .b .verb { opacity: .62; }
  .b b { font-weight: 600; }
  .logo { width: 18px; height: 18px; flex: none; }
  .png { display: inline-block; width: 18px; background: currentColor; -webkit-mask: var(--src) left center / auto 100% no-repeat; }
  .arrow { opacity: .55; font-size: 13px; margin-left: -2px; }`;
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
mkdirSync(out, { recursive: true });
const logos = Object.fromEntries(await Promise.all(BADGES.map(async (b) => [b.id, await logoMarkup(b)])));
for (const dark of [false, true]) {
  const page = await browser.newPage({ deviceScaleFactor: 3 });
  const html = BADGES.map((b) => {
    const color = b.color ? ` style="color:${b.color}"` : '';
    const logo = logos[b.id].replace('class="logo', `${color} class="logo`);
    const tail = b.kind === 'setup' ? '<span class="arrow">↗</span>' : '';
    return `<span class="b ${b.kind}" id="${b.id}">${logo}<span class="verb">${b.verb}</span><b>${b.label}</b>${tail}</span>`;
  }).join('');
  await page.setContent(`<!doctype html><html><head><style>${css(dark)}</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  for (const b of BADGES) {
    const file = join(out, `${b.id}${dark ? '-dark' : ''}.png`);
    await page.locator(`#${b.id}`).screenshot({ path: file, omitBackground: true });
  }
  await page.close();
}
await browser.close();
console.log(`wrote ${BADGES.length * 2} badges to ${out}`);
