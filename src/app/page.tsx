import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { edition } from '@/edition';
import { ownerUsername } from '@/lib/pages';
import { Landing } from '@/components/marketing/Landing';
import UserPage, { generateMetadata as userMetadata } from './[username]/page';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  if (edition.root === 'marketing') return {};
  const username = await ownerUsername();
  return username ? userMetadata({ params: Promise.resolve({ username }) }) : {};
}

/** "/" is the owner's page (self-hosted) or the marketing site (POSY_ROOT=marketing). */
export default async function Home() {
  if (edition.root === 'marketing') return <Landing />;
  const username = await ownerUsername();
  if (!username) redirect('/signup');
  return <UserPage params={Promise.resolve({ username })} />;
}
