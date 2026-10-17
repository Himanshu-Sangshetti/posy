import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { OG_FALLBACK, SITE_NAME } from '@/lib/meta';
import { siteUrl } from '@/lib/site';

export const dynamicParams = false;
const DOCS = { agents: { file: 'connect.md', title: 'Connect an AI to Posy' }, format: { file: 'format.md', title: 'The Posy page file' } } as const;
type Slug = keyof typeof DOCS;

export const generateStaticParams = () => (Object.keys(DOCS) as Slug[]).map(slug => ({ slug }));

const DOC_DESCRIPTION: Record<Slug, string> = {
  agents: 'Connect Claude, ChatGPT, Cursor or VS Code to Posy over MCP. Sign in once, then ask your AI to edit your link-in-bio page. Nothing goes live until you publish.',
  format: 'A Posy page is one small JSON file. The brief format, the looks and themes you can set, and how to open a preview or import it through the API.',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug as Slug;
  const d = DOCS[slug];
  if (!d) return {};
  const title = `${d.title} · Posy`;
  const description = DOC_DESCRIPTION[slug];
  const canonical = `/docs/${slug}`;
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: SITE_NAME, type: 'website', images: [{ url: OG_FALLBACK, width: 1200, height: 630, alt: 'Posy' }] },
    twitter: { card: 'summary_large_image', title, description, images: [OG_FALLBACK] },
  };
}

const DOC_LINKS: Record<string, string> = {
  'ai-agents.md': 'https://github.com/Himanshu-Sangshetti/posy/blob/main/docs/ai-agents.md',
  'self-hosting.md': 'https://github.com/Himanshu-Sangshetti/posy/blob/main/docs/self-hosting.md',
  'telemetry.md': 'https://github.com/Himanshu-Sangshetti/posy/blob/main/docs/telemetry.md',
  'connect.md': '/docs/agents',
  'format.md': '/docs/format',
};

const render = (md: string, site: string) => {
  const html = marked.parse(md.replaceAll('YOUR-POSY', site.replace(/^https?:\/\//, '')), { async: false }) as string;
  return html.replace(/href="([^"]+\.md)(#[^"]*)?"/g, (_m, file: string, hash = '') => `href="${DOC_LINKS[file] ?? file}${hash}"`);
};

/** Public docs for agents and people, rendered from /docs/*.md at build time. */
export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = DOCS[(await params).slug as Slug];
  if (!d) notFound();
  const html = render(fs.readFileSync(path.join(process.cwd(), 'docs', d.file), 'utf8'), siteUrl());
  return (
    <main className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-28">
      <article className="posy-doc" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
