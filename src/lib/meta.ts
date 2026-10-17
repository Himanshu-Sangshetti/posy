// Names and descriptions shared by every page and both editions (self-hosted and posy.page).

export const SITE_NAME = 'Posy';
export const OG_FALLBACK = '/brand/og.png';

/** One sentence about Posy, used in metadata, structured data, llms.txt and package.json so they never drift. */
export const ENTITY_DESCRIPTION = 'A link-in-bio page that looks hand-made. Pick a look, add your links, publish. Edit it yourself or let your AI do it.';

export function profileMeta(name: string, bio: string | undefined, username: string) {
  const clean = (bio ?? '').replace(/\s+/g, ' ').trim();
  const who = `${name.trim() || username} (@${username})`;
  let description = clean ? `${who} on Posy. ${clean}` : `${who} on Posy, a link-in-bio page that looks hand-made.`;
  if (description.length < 70) description = `${description.replace(/[.\s]*$/, '')}. A hand-made page for links, music, videos and photos.`;
  if (description.length > 160) description = `${description.slice(0, 157).replace(/\s+\S*$/, '').replace(/[.,;:\s]+$/, '')}…`;
  if (description.length < 70 || description.length > 160) description = `${who} on Posy. A link-in-bio page that looks hand-made, for links, music and photos.`.slice(0, 160);
  const raw = name.trim() || username;
  const title = raw.length <= 60 ? raw : `${raw.slice(0, 59).replace(/\s+\S*$/, '').replace(/[.,;:\s]+$/, '')}…`;
  return { title, description };
}

/** A description that fits a search snippet (160 characters): whole sentences if they fit, else cut at a word. */
export function snippet(text: string, max = 160) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const sentences = t.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = '';
  for (const s of sentences) { if ((out + s).trim().length > max) break; out += s; }
  if (out.trim().length >= 110) return out.trim();
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[.,;:\s]+$/, '')}…`;
}

/** "Title · Posy" when it fits in 60 characters, otherwise the title alone. */
export const pageTitle = (title: string) => (title.length + 7 <= 60 ? `${title} · Posy` : title);
