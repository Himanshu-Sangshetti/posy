import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

// Files named *.dev.ts(x) exist only while developing (local save / upload / unfurl APIs).
// Files named *.studio.tsx are the editor: always in dev, in production only for a playground build.
export default function config(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  const studio = dev || process.env.POSY_PLAYGROUND === '1';
  const ext = ['tsx', 'ts'];
  return {
    output: dev ? undefined : 'export',
    basePath: process.env.POSY_BASE_PATH || undefined,
    images: { unoptimized: true },
    devIndicators: false,
    agentRules: false, // we keep our own (git-ignored) AGENTS.md
    trailingSlash: true,
    pageExtensions: [...ext, ...(dev ? ['dev.tsx', 'dev.ts'] : []), ...(studio ? ['studio.tsx'] : [])],
    env: { NEXT_PUBLIC_BASE_PATH: process.env.POSY_BASE_PATH || '', NEXT_PUBLIC_POSY_DEV: dev ? '1' : '' },
  };
}
