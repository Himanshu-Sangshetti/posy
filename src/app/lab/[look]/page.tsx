// Component lab (development only): every component of a look, in every state and content case, at real size.
// Each look keeps its own lab in ./<look>-lab.tsx.
import { notFound } from 'next/navigation';
import { LofiLab } from './lofi-lab';
import { WashiLab } from './washi-lab';
import { PaintedLab } from './painted-lab';
import { DeskLab } from './cozy-lab';
import './lab.css';

export const dynamic = 'force-dynamic';

const LABS: Record<string, (props: { p?: string }) => React.ReactNode> = { lofi: LofiLab, washi: WashiLab, painted: PaintedLab, cozy: DeskLab };

export default async function Lab({ params, searchParams }: { params: Promise<{ look: string }>; searchParams: Promise<{ p?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { look } = await params; const { p } = await searchParams;
  const L = LABS[look];
  if (!L) notFound();
  return <L p={p} />;
}
