// What "/" shows. Self-hosted: the owner's page. The hosted platform replaces this file with its marketing site.
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { edition } from '@/edition';
import { ownerUsername } from '@/lib/pages';
import UserPage, { generateMetadata as userMetadata } from '@/app/[username]/page';

export async function homeMetadata(): Promise<Metadata> {
  if (edition.root !== 'owner-page') return {};
  const username = await ownerUsername();
  return username ? userMetadata({ params: Promise.resolve({ username }) }) : {};
}

export async function Home() {
  if (edition.root !== 'owner-page') redirect('/signup');
  const username = await ownerUsername();
  if (!username) redirect('/signup');
  return <UserPage params={Promise.resolve({ username })} />;
}
