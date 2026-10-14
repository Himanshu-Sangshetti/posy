import { Geist, Geist_Mono, Instrument_Serif, Nunito, Fraunces, DM_Serif_Display, DM_Sans, Bricolage_Grotesque, Space_Grotesk, Sora, Caveat, VT323, IBM_Plex_Mono, Chakra_Petch, Young_Serif, Cormorant_Garamond, Bodoni_Moda } from 'next/font/google';

// next/font needs literal options. Only Geist is preloaded; the rest download only when a page uses them.
export const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
export const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap', preload: false });
export const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap', preload: false });
export const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito', display: 'swap', preload: false });
export const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', preload: false, axes: ['SOFT', 'opsz'] });
export const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dm-serif', display: 'swap', preload: false });
export const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap', preload: false });
export const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', preload: false });
export const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap', preload: false });
export const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap', preload: false });
export const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap', preload: false });
export const vt323 = VT323({ subsets: ['latin'], weight: '400', variable: '--font-vt323', display: 'swap', preload: false });
export const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono', display: 'swap', preload: false });
export const youngSerif = Young_Serif({ subsets: ['latin'], weight: '400', variable: '--font-young-serif', display: 'swap', preload: false });
export const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap', preload: false });
export const bodoni = Bodoni_Moda({ subsets: ['latin'], variable: '--font-bodoni', display: 'swap', preload: false });
export const chakra = Chakra_Petch({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-chakra', display: 'swap', preload: false });

import { EDITION_FONT_VARIABLES } from '@/edition/font-faces';

export const fontVariables = [geist, geistMono, serif, nunito, fraunces, dmSerif, dmSans, bricolage, spaceGrotesk, sora, caveat, vt323, plexMono, chakra, youngSerif, cormorant, bodoni].map(f => f.variable).join(' ') + (EDITION_FONT_VARIABLES ? ' ' + EDITION_FONT_VARIABLES : '');
