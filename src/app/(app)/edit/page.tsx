import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { pageForUser, hasUnpublished } from '@/lib/pages';
import { parsePage } from '@/lib/schema';
import { siteUrl } from '@/lib/site';
import { Studio } from '@/components/studio/Studio';
import { edition } from '@/edition';
import { entitlementsFor } from '@/lib/entitlements';

export const metadata: Metadata = { title: 'Editor · Posy', robots: { index: false } };

export default async function EditPage() {
  const user = await requireUser();
  const row = await pageForUser(user.id);
  if (!row) redirect('/onboarding');
  return (
    <Suspense>
      <Studio init={{ page: parsePage(row.draft), version: row.version, username: row.username, hasUnpublished: hasUnpublished(row), site: siteUrl(), entitlements: await entitlementsFor(user.id), nav: edition.nav }} />
    </Suspense>
  );
}
