import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { marked } from 'marked';
import { siteUrl } from '@/lib/site';

export const dynamicParams = false;
const DOCS = { agents: { file: 'connect.md', title: 'Connect an AI to Posy' }, format: { file: 'format.md', title: 'The Posy page file' } } as const;
type Slug = keyof typeof DOCS;

export const generateStaticParams = () => (Object.keys(DOCS) as Slug[]).map(slug => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = DOCS[(await params).slug as Slug];
  return d ? { title: `${d.title} · Posy`, alternates: { canonical: `/docs/${(await params).slug}` } } : {};
}

const render = (md: string, site: string) => marked.parse(md.replaceAll('YOUR-POSY', site.replace(/^https?:\/\//, '')), { async: false }) as string;

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
