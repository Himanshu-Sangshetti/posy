import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { edition } from '@/edition';
import { ownerUsername } from '@/lib/pages';
import UserPage, { generateMetadata as userMetadata } from './[username]/page';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const username = edition.root === 'owner-page' ? await ownerUsername() : null;
  return username ? userMetadata({ params: Promise.resolve({ username }) }) : {};
}

/** Self-hosted: "/" is the owner's page. (The hosted platform shows its marketing site here.) */
export default async function Home() {
  if (edition.root !== 'owner-page') redirect('/signup');
  const username = await ownerUsername();
  if (!username) redirect('/signup');
  return <UserPage params={Promise.resolve({ username })} />;
}
