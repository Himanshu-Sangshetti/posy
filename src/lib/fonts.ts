import { Geist, Geist_Mono, Instrument_Serif, Nunito } from 'next/font/google';

export const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
export const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
export const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });
export const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap' });

export const fontVariables = [geist.variable, geistMono.variable, serif.variable, nunito.variable].join(' ');

/** Body + heading font for each Posy font option. */
export const FONT_PAIRS = {
  soft: { body: 'var(--font-geist)', head: 'var(--font-geist)', label: 'Soft' },
  editorial: { body: 'var(--font-geist)', head: 'var(--font-serif)', label: 'Editorial' },
  rounded: { body: 'var(--font-nunito)', head: 'var(--font-nunito)', label: 'Rounded' },
  mono: { body: 'var(--font-geist)', head: 'var(--font-geist-mono)', label: 'Mono' },
} as const;
