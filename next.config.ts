import type { NextConfig } from 'next';

const dev = process.env.NODE_ENV !== 'production';
const posthog = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/+$/, '');
const vercelLive = process.env.VERCEL_ENV === 'preview' ? ' https://vercel.live' : '';

// Next.js inlines its bootstrap scripts, so script-src needs 'unsafe-inline' without per-request nonces (which would
// make every page dynamic). Pictures can come from any https host the user links; embeds are YouTube and Spotify only.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}${vercelLive}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:" + (dev ? ' http:' : ''),
  "media-src 'self' blob: https:",
  `connect-src 'self' https://api.github.com ${posthog}${vercelLive}${dev ? ' ws: wss:' : ''}`,
  `frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://open.spotify.com${vercelLive}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ');

const security = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
  // Browsers ignore this over plain http, so it only takes effect on https deployments.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
];
// Sign-in, consent and account screens are never framed, not even by Posy itself (the onboarding preview is).
const noFrames = [
  { key: 'Content-Security-Policy', value: csp.replace("frame-ancestors 'self'", "frame-ancestors 'none'") },
  { key: 'X-Frame-Options', value: 'DENY' },
];

const config: NextConfig = {
  images: { unoptimized: true },
  devIndicators: false,
  poweredByHeader: false,
  agentRules: false, // we keep our own (git-ignored) AGENTS.md
  serverExternalPackages: ['@libsql/client'],
  // Docker / plain Node hosting: a self-contained server in .next/standalone
  output: process.env.POSY_STANDALONE ? 'standalone' : undefined,
  outputFileTracingIncludes: { '/*': ['./drizzle/**/*'], '/llms-full.txt': ['./docs/*.md'] },
  async headers() {
    return [
      { source: '/:path*', headers: security },
      ...['/login', '/signup', '/oauth/:path*', '/settings', '/agents', '/billing', '/analytics', '/edit', '/new'].map(source => ({ source, headers: noFrames })),
    ];
  },
};

export default config;
