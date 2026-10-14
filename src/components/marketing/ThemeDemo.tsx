'use client';

import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type Option = { id: string; name: string; bg: string; accent: string; dark: boolean; node: ReactNode };
const spring = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } as const;

/** All previews are server-rendered and stacked; this just fades between them. First one shows without JS. */
export function ThemeDemo({ options }: { options: Option[] }) {
  const [active, setActive] = useState(options[0].id);
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14">
      <div className="order-2 lg:order-1">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          {options.map(o => (
            <motion.button key={o.id} type="button" role="radio" aria-checked={active === o.id} onClick={() => setActive(o.id)}
              whileHover={{ y: -3, transition: spring }} whileTap={{ scale: 0.97 }}
              className={cn('flex items-center gap-3 rounded-[18px] border bg-[var(--surface)] p-3 text-left text-[15px] font-medium transition-colors', active === o.id ? 'border-[var(--text)]' : 'border-[var(--line)] hover:border-[color-mix(in_oklab,var(--text)_30%,var(--line))]')}>
              <span className="relative size-9 shrink-0 overflow-hidden rounded-[12px] border border-black/10" style={{ background: o.bg }}>
                <span className="absolute bottom-1.5 right-1.5 size-3.5 rounded-full" style={{ background: o.accent }} />
              </span>
              {o.name}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="order-1 mx-auto lg:order-2">
        <div className="relative h-[440px] w-[340px] overflow-hidden rounded-[30px] border border-[var(--line)] shadow-[0_40px_80px_-40px_rgb(0_0_0/.45)]">
          {options.map(o => (
            <div key={o.id} aria-hidden={active !== o.id} className={cn('absolute inset-0 transition-[opacity,transform] duration-500 ease-out', active === o.id ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0')}>{o.node}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
