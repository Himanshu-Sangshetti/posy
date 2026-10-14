import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';
import { pageForUser } from '@/lib/pages';
import { SITE_HOST } from '@/lib/site';
import { SettingsPanel } from '@/components/dash/SettingsPanel';

export const metadata: Metadata = { title: 'Settings · Posy' };

export default async function SettingsPage() {
  const user = await requireUser();
  const row = (await pageForUser(user.id))!;
  return (
    <div className="posy-rise grid gap-7">
      <h1 className="app-h1 mb-4 mt-6">Settings</h1>
      <SettingsPanel username={row.username} email={user.email} host={SITE_HOST()} />
    </div>
  );
}
