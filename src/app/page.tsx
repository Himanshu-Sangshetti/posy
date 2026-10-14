import { PageView } from '@/components/page/PageView';
import { readPage, withLiveData } from '@/lib/content';

export default async function Home() {
  const page = await withLiveData(readPage());
  return <PageView page={page} />;
}
