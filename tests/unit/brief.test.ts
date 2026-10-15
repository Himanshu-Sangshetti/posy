import { describe, it, expect } from 'vitest';
import { readBrief, briefToPage, extractJson, encodeBrief, decodeBrief, briefPrompt, BriefError } from '@/lib/brief';
import { STYLE_IDS } from '@/lib/styles';

const brief = { posy: 1, username: 'mira', name: 'Mira Sol', bio: 'Illustrator', look: STYLE_IDS[0], links: [{ heading: 'Find me' }, 'https://github.com/mira', 'mira/atlas', 'hi@mira.so', { url: 'https://mira.so', title: 'Portfolio', size: 'w' }, { text: 'Open for work' }] };

describe('brief', () => {
  it('turns a brief into a page, picking tile types from the links', () => {
    const { page, username, warnings } = readBrief(JSON.stringify(brief));
    expect(username).toBe('mira');
    expect(warnings).toEqual([]);
    expect(page.profile).toMatchObject({ name: 'Mira Sol', bio: 'Illustrator' });
    expect(page.tiles.map(t => t.type)).toEqual(['heading', 'social', 'github', 'social', 'link', 'text']);
    expect(page.tiles[4]).toMatchObject({ title: 'Portfolio', size: 'w' });
  });

  it('reads a reply wrapped in prose and a code fence, with smart quotes and trailing commas', () => {
    const reply = 'Here you go! ✨\n```json\n{ “name”: “Mira”, "links": ["https://github.com/mira",], }\n```\nLet me know if you want changes.';
    const { page } = readBrief(reply);
    expect(page.profile.name).toBe('Mira');
    expect(page.tiles).toHaveLength(1);
  });

  it('explains what is wrong in words a person can paste back to the chat', () => {
    expect(() => readBrief('no json here')).toThrow(BriefError);
    expect(() => readBrief('{ name: "x", links: [] }')).toThrow(/valid JSON|find a JSON/);
    expect(() => readBrief('{ "links": [] }')).toThrow(/"name" and a "links" list/);
  });

  it('keeps going on small mistakes and reports them', () => {
    const { page, warnings } = briefToPage({ name: 'Mira', look: 'nonsense', theme: 'nope', colour: 'red', username: 'A B', links: ['https://github.com/mira', { url: 'https://a.com', text: 'both' }] });
    expect(page.tiles).toHaveLength(1);
    expect(warnings.join('\n')).toMatch(/Unknown look/);
    expect(warnings.join('\n')).toMatch(/Unknown theme/);
    expect(warnings.join('\n')).toMatch(/Ignored "colour"/);
    expect(warnings.join('\n')).toMatch(/not a valid username/);
    expect(warnings.join('\n')).toMatch(/link 2: give exactly one/);
  });

  it('accepts the full page JSON Posy exports', () => {
    const { page } = readBrief(JSON.stringify(briefToPage(brief).page));
    expect(page.tiles).toHaveLength(6);
  });

  it('round-trips through the /new#p= encoding, including non-ASCII', () => {
    const b = { ...brief, name: 'Mira Sólé ✿' };
    expect(decodeBrief(encodeBrief(b))).toEqual(b);
  });

  it('writes a prompt that lists the real looks', () => {
    const p = briefPrompt('https://posy.page');
    for (const id of STYLE_IDS) expect(p).toContain(id);
    expect(p).toContain('ONLY a JSON object');
  });

  it('extractJson ignores a line comment', () => {
    expect(extractJson('{ "name": "a", // note\n "links": [] }')).toEqual({ name: 'a', links: [] });
  });
});
