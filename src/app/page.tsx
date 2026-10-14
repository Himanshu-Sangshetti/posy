import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { edition } from '@/edition';
import { ownerUsername } from '@/lib/pages';
import UserPage, { generateMetadata as userMetadata } from './[username]/page';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (edition.root !== 'owner-page') return {};
  const username = await ownerUsername();
  return username ? userMetadata({ params: Promise.resolve({ username }) }) : {};
}

/** Self-hosted: "/" is the owner's page. (The hosted platform replaces this with its own site.) */
export default async function Home() {
  if (edition.root !== 'owner-page') redirect('/signup');
  const username = await ownerUsername();
  if (!username) redirect('/signup');
  return <UserPage params={Promise.resolve({ username })} />;
}
