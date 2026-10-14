import type { NextConfig } from 'next';

const config: NextConfig = {
  images: { unoptimized: true },
  devIndicators: false,
  agentRules: false, // we keep our own (git-ignored) AGENTS.md
  serverExternalPackages: ['@libsql/client'],
};

export default config;
