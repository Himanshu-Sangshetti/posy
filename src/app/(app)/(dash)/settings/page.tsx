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
    <div className="posy-rise grid gap-5">
      <h1 className="mb-2 mt-6 text-[32px] font-semibold tracking-[-0.03em]">Settings</h1>
      <SettingsPanel username={row.username} email={user.email} host={SITE_HOST()} />
    </div>
  );
}
