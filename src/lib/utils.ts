import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
/** Prefix local /public paths with the deploy base path (GitHub Pages project sites). */
export function asset(src?: string) { return src && src.startsWith('/') && !src.startsWith('//') ? BASE + src : src; }
