import { Suspense } from 'react';
import type { Metadata } from 'next';
import { currentUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { siteUrl } from '@/lib/site';
import { NewFromFile } from '@/components/auth/NewFromFile';

export const metadata: Metadata = {
  title: 'Make a page from a file · Posy',
  description: 'Ask any chat (ChatGPT, Claude, Gemini) to write your link-in-bio page as a small JSON file, then load it here.',
  alternates: { canonical: '/new' },
};

/** Load a Posy page file (written by any chat, or exported from another Posy). Public: nobody needs an account to preview. */
export default async function NewPage() {
  const user = await currentUser();
  const hasPage = user ? !!(await pageForUser(user.id)) : false;
  return <Suspense><NewFromFile signedIn={!!user} hasPage={hasPage} site={siteUrl()} /></Suspense>;
}
