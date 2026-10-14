/**
 * Helpers for moving a page between Posy instances. Safe to import anywhere (no Zod).
 *
 * Uploaded files live on the server that stored them, as `/uploads/...`. When you export,
 * those paths are turned into full URLs so the file still loads on another instance.
 * They keep loading from the original server, so keep it running (or re-upload the images).
 */
export function absolutizeUploads<T>(value: T, origin: string): T {
  const base = origin.replace(/\/$/, '');
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return v.startsWith('/uploads/') ? base + v : v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as T;
}

/** The file we write on export. */
export function exportFile(page: object, origin: string) {
  return { $schema: 'https://posy.page/schema/page.schema.json', ...absolutizeUploads(page, origin) };
}

/** Parse an uploaded file's text into something the page API accepts, or throw a readable error. */
export function readImport(text: string): Record<string, unknown> {
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error('That file is not valid JSON.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Expected a Posy page file (a JSON object).');
  const { $schema: _ignored, ...page } = data as Record<string, unknown>;
  return page;
}
