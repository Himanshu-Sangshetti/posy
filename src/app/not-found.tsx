import Link from 'next/link';
import { PosyMark } from '@/components/brand';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f6f1e9] px-6 text-center text-[#2b2621]">
      <div className="grid justify-items-center gap-5">
        <PosyMark className="size-14" />
        <h1 className="text-[34px] font-semibold tracking-[-0.03em]">Nothing blooming here yet</h1>
        <p className="max-w-[36ch] text-[17px] leading-relaxed text-[#8c8277]">This page doesn&apos;t exist, or it hasn&apos;t been published. The name might still be free.</p>
        <Link href="/signup" className="mt-2 inline-flex h-11 items-center rounded-full bg-[#2b2621] px-6 text-[15px] font-medium text-[#fffcf7] transition-transform hover:scale-[1.03]">Claim it on Posy</Link>
      </div>
    </main>
  );
}
