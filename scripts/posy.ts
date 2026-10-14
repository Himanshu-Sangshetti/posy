#!/usr/bin/env tsx
/**
 * Posy CLI: edit your page from the terminal (or let your AI agent do it).
 *   npm run posy -- add <link | email | owner/repo | "a note"> [--size s|w|t|l] [--color <tint>]
 *   npm run posy -- theme <preset> [--accent #hex] [--font soft|editorial|rounded|mono] [--radius sharp|soft|round] [--layout split|stack]
 *   npm run posy -- list | remove <id> | validate | schema
 */
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { Page, SIZES, COLORS, FONTS, RADII, LAYOUTS } from '../src/lib/schema';
import { THEME_IDS } from '../src/lib/themes';
import { tileFromInput } from '../src/lib/detect';

const FILE = path.resolve(process.env.POSY_CONTENT || 'content/page.json');
const SCHEMA = path.resolve('schema/page.schema.json');
const [cmd, ...rest] = process.argv.slice(2);
const flags: Record<string, string> = {};
const args: string[] = [];
for (let i = 0; i < rest.length; i++) rest[i].startsWith('--') ? (flags[rest[i].slice(2)] = rest[++i]) : args.push(rest[i]);

const read = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const write = (data: unknown) => {
  const page = Page.parse(data);
  const { $schema, ...body } = page;
  fs.writeFileSync(FILE, JSON.stringify({ $schema: $schema ?? '../schema/page.schema.json', ...body }, null, 2) + '\n');
};
const oneOf = <T extends readonly string[]>(name: string, v: string | undefined, list: T): T[number] | undefined => {
  if (v === undefined) return undefined;
  if (!list.includes(v)) { console.error(`--${name} must be one of: ${list.join(', ')}`); process.exit(1); }
  return v as T[number];
};

switch (cmd) {
  case 'validate': {
    const r = Page.safeParse(read());
    if (r.success) { console.log(`✓ ${path.relative(process.cwd(), FILE)} is valid (${r.data.tiles.length} tiles)`); break; }
    for (const i of r.error.issues) console.error(`✗ ${i.path.join('.') || '(root)'}: ${i.message}`);
    process.exit(1);
  }
  case 'schema': {
    const schema = z.toJSONSchema(Page, { io: 'input', target: 'draft-2020-12' });
    fs.mkdirSync(path.dirname(SCHEMA), { recursive: true });
    fs.writeFileSync(SCHEMA, JSON.stringify({ title: 'Posy page', ...schema }, null, 2) + '\n');
    console.log(`✓ wrote ${path.relative(process.cwd(), SCHEMA)}`);
    break;
  }
  case 'list': {
    for (const t of Page.parse(read()).tiles) {
      const what = 'url' in t ? t.url : 'handle' in t ? `${t.platform} @${t.handle}` : 'repo' in t ? t.repo : 'text' in t ? t.text : 'src' in t ? t.src : '';
      console.log(`${t.id.padEnd(11)} ${t.type.padEnd(8)} ${t.type === 'heading' ? '' : t.size}  ${what}`);
    }
    break;
  }
  case 'add': {
    if (!args[0]) { console.error('usage: add <link | email | owner/repo | "a note">'); process.exit(1); }
    const page = read();
    const tile = { ...tileFromInput(args.join(' ')), ...(flags.size && { size: oneOf('size', flags.size, SIZES) }), ...(flags.color && { color: oneOf('color', flags.color, COLORS) }) };
    page.tiles.push(tile);
    write(page);
    console.log(`✓ added ${tile.type} tile ${tile.id}`);
    break;
  }
  case 'remove': {
    const page = read();
    const before = page.tiles.length;
    page.tiles = page.tiles.filter((t: { id: string }) => t.id !== args[0]);
    if (page.tiles.length === before) { console.error(`no tile with id ${args[0]}`); process.exit(1); }
    write(page);
    console.log(`✓ removed ${args[0]}`);
    break;
  }
  case 'theme': {
    const page = read();
    page.theme = {
      ...page.theme,
      ...(args[0] && { preset: oneOf('preset', args[0], THEME_IDS) }),
      ...(flags.accent && { accent: flags.accent }),
      ...(flags.font && { font: oneOf('font', flags.font, FONTS) }),
      ...(flags.radius && { radius: oneOf('radius', flags.radius, RADII) }),
      ...(flags.layout && { layout: oneOf('layout', flags.layout, LAYOUTS) }),
    };
    write(page);
    console.log(`✓ theme updated`);
    break;
  }
  default:
    console.log(`posy: edit content/page.json

  add <link | email | owner/repo | "note">  [--size s|w|t|l] [--color ${COLORS.join('|')}]
  theme <${THEME_IDS.join('|')}>  [--accent #hex] [--font ${FONTS.join('|')}] [--radius ${RADII.join('|')}] [--layout ${LAYOUTS.join('|')}]
  list | remove <id> | validate | schema`);
}
