import type { NextConfig } from 'next';

const config: NextConfig = {
  images: { unoptimized: true },
  devIndicators: false,
  agentRules: false, // we keep our own (git-ignored) AGENTS.md
  serverExternalPackages: ['@libsql/client'],
  // Docker / plain Node hosting: a self-contained server in .next/standalone
  output: process.env.POSY_STANDALONE ? 'standalone' : undefined,
  outputFileTracingIncludes: { '/*': ['./drizzle/**/*'], '/llms-full.txt': ['./docs/*.md'] },
};

export default config;
