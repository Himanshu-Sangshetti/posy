import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { SITE_HOST } from '@/lib/site';
import { PageHead } from '@/components/dash/ui';
import { SettingsPanel } from '@/components/dash/SettingsPanel';

export const metadata: Metadata = { title: 'Settings · Posy' };

export default async function SettingsPage() {
  const user = await requireUser();
  const row = (await pageForUser(user.id))!;
  return (
    <div className="grid gap-8">
      <PageHead eyebrow="Settings" title={<>Your <i>account</i></>} lede="Your address, your data, and the keys to the door." />
      <SettingsPanel username={row.username} email={user.email} host={SITE_HOST()} />
    </div>
  );
}
