import { publicPage } from '@/lib/pages';
import { siteUrl } from '@/lib/site';
import { profileUrl } from '@/lib/platforms';
import { PLATFORMS } from '@/lib/platforms';

/** A plain-text version of the page for AI assistants and crawlers. */
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const r = await publicPage((await params).username);
  if (!r) return new Response('Not found', { status: 404 });
  const { page, row } = r;
  const lines = [`# ${page.profile.name}`, '', page.profile.bio ? `> ${page.profile.bio}` : '', page.profile.location ? `Location: ${page.profile.location}` : '', ''];
  for (const t of page.tiles) {
    if (t.type === 'heading') lines.push('', `## ${t.text}`);
    else if (t.type === 'social') lines.push(`- ${PLATFORMS[t.platform].label}: ${profileUrl(t.platform, t.handle, t.url)}`);
    else if (t.type === 'link') lines.push(`- [${t.title || t.url}](${t.url})${t.description ? `: ${t.description}` : ''}`);
    else if (t.type === 'github') lines.push(`- GitHub repo: https://github.com/${t.repo}${t.description ? `: ${t.description}` : ''}`);
    else if (t.type === 'text') lines.push(`- ${t.text.replace(/\n/g, ' ')}`);
    else if (t.type === 'video' || t.type === 'music') lines.push(`- ${t.type === 'video' ? 'Video' : 'Music'}: ${t.url}`);
    else if (t.type === 'image' && t.url) lines.push(`- Image link: ${t.url}`);
  }
  lines.push('', `Page: ${siteUrl()}/${row.username} · JSON: ${siteUrl()}/api/v1/public/${row.username}`);
  return new Response(lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n'), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
