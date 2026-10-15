// A painting across the top of an app page that fades into the white below, with a cloud drifting over it.
// The page title sits in its sky. Used by the dashboard (the rooftop garden) and onboarding (choosing what to pin up).
import { cn } from '@/lib/utils';
import './scene.css';

export function SkyBand({ src, small, position = '50% 70%', className, cloud = true }: { src: string; small?: string; position?: string; className?: string; cloud?: boolean }) {
  return (
    <div aria-hidden className={cn('sb', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sb-pic" src={src} srcSet={small ? `${small} 960w, ${src} 1920w` : undefined} sizes="100vw" alt="" style={{ objectPosition: position }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {cloud && <img className="sb-cloud" src="/art/cloud.webp" alt="" />}
    </div>
  );
}
