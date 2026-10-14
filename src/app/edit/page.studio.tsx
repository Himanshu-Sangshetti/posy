import type { Metadata } from 'next';
import { Studio } from '@/components/studio/Studio';
import { readPage } from '@/lib/content';

export const metadata: Metadata = { title: 'Posy Studio', robots: { index: false } };

export default function EditPage() {
  return <Studio initial={readPage()} />;
}
