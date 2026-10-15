import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { SITE_HOST } from '@/lib/site';
import { PageHead } from '@/components/dash/ui';
import { SettingsPanel } from '@/components/dash/SettingsPanel';
import { db } from '@/db';
import { account } from '@/db/auth-schema';
import { and, eq } from 'drizzle-orm';

export const metadata: Metadata = { title: 'Settings · Posy' };

export default async function SettingsPage() {
  const user = await requireUser();
  const row = (await pageForUser(user.id))!;
  // people who signed up with Google or GitHub have no password to confirm with
  const hasPassword = !!(await db.select({ id: account.id }).from(account).where(and(eq(account.userId, user.id), eq(account.providerId, 'credential'))).get());
  return (
    <div className="grid gap-8">
      <PageHead eyebrow="Settings" title={<>Your <i>account</i></>} lede="Your address, your data, and the keys to the door." />
      <SettingsPanel username={row.username} email={user.email} host={SITE_HOST()} hasPassword={hasPassword} />
    </div>
  );
}
