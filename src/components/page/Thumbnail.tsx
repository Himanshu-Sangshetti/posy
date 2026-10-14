import type { Page } from '@/lib/schema';
import { PageView } from './PageView';
import { cn } from '@/lib/utils';

/** A real page, rendered at `width` and scaled down to fit `scale`. Inert (no links, no effects). */
export function Thumbnail({ page, width = 1280, height = 900, scale = 0.3, className }: { page: Page; width?: number; height?: number; scale?: number; className?: string }) {
  return (
    <div aria-hidden className={cn('posy-thumb', className)} style={{ width: width * scale, height: height * scale }} inert>
      <div style={{ width, height, transform: `scale(${scale})` }}><PageView page={page} contained /></div>
    </div>
  );
}
