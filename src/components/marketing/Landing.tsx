// Marketing site for the hosted edition (POSY_ROOT=marketing). Server-rendered; only the claim form, theme demo and code tabs are client islands.
import { ArrowRight, Check, Download, KeyRound, Link2, Server, Sparkles } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { siGithub } from 'simple-icons';
import { Logo } from '@/components/brand';
import { Thumbnail } from '@/components/page/Thumbnail';
import { parsePage, type Page } from '@/lib/schema';
import { SITE_HOST, siteUrl } from '@/lib/site';
import { THEMES } from '@/lib/themes';
import creator from '../../../examples/creator.json';
import developer from '../../../examples/developer.json';
import { AgentTabs } from './AgentTabs';
import { ClaimForm } from './ClaimForm';
import { ThemeDemo } from './ThemeDemo';

const GITHUB = 'https://github.com/Himanshu-Sangshetti/posy';
const wrap = 'mx-auto w-full max-w-[1120px] px-5 sm:px-8';
const card = 'min-w-0 rounded-[28px] border border-[color-mix(in_oklab,#fff_55%,transparent)] bg-[color-mix(in_oklab,var(--surface)_78%,transparent)] p-6 shadow-[0_24px_60px_-38px_rgb(0_0_0/.35)] backdrop-blur-xl sm:p-8 dark:border-[var(--line)]';
const rise = (i: number) => ({ '--i': i }) as CSSProperties;

const example = (data: unknown, over: Record<string, unknown> = {}): Page => {
  const p = parsePage(data);
  return { ...p, badge: false, theme: { ...p.theme, ...over } };
};

function Section({ id, title, lead, children }: { id?: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 py-16 sm:py-24">
      <div className={wrap}>
        <h2 className="posy-rise max-w-[22ch] text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[46px]">{title}</h2>
        {lead && <p className="posy-rise mt-4 max-w-[56ch] text-[17px] leading-relaxed text-[var(--muted)] sm:text-[18px]" style={rise(1)}>{lead}</p>}
        <div className="mt-10 sm:mt-12">{children}</div>
      </div>
    </section>
  );
}

function Phone({ page, className = '' }: { page: Page; className?: string }) {
  return (
    <div className={`rounded-[40px] border border-[var(--line)] bg-[var(--surface)] p-2.5 shadow-[0_50px_90px_-44px_rgb(0_0_0/.5)] ${className}`}>
      <div className="overflow-hidden rounded-[30px]"><Thumbnail page={page} width={390} height={780} scale={0.64} /></div>
    </div>
  );
}

function Browser({ page, host }: { page: Page; host: string }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_50px_90px_-44px_rgb(0_0_0/.5)]">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>{['#f6b8a0', '#f7d98f', '#a9dcc4'].map(c => <i key={c} className="size-3 rounded-full" style={{ background: c }} />)}</span>
        <span className="mx-auto rounded-[10px] bg-[var(--secondary)] px-4 py-1 text-[14px] text-[var(--muted)]">{host}/ada</span>
        <span className="w-12" aria-hidden />
      </div>
      <Thumbnail page={page} width={1100} height={760} scale={0.5} />
    </div>
  );
}

export function Landing() {
  const host = SITE_HOST();
  const site = siteUrl();
  const hero = example(creator);
  const phone = example(developer);
  const demoThemes = ['cream', 'lavender', 'mint', 'midnight'] as const;
  const demo = demoThemes.map(id => ({
    id, name: THEMES[id].name, bg: THEMES[id].bg, accent: THEMES[id].accent, dark: THEMES[id].dark,
    node: <Thumbnail page={example(creator, { preset: id, layout: 'bento', align: 'center' })} width={390} height={505} scale={340 / 390} />,
  }));
  const pasted = parsePage({
    profile: { name: 'Ada', bio: 'Notes on small software.' },
    theme: { preset: 'sky', font: 'soft', layout: 'bento', align: 'center', background: { style: 'mesh' }, tileStyle: 'glass' },
    tiles: [
      { id: 'p-gh', type: 'github', repo: 'vercel/next.js', description: 'The React Framework', stars: 140000, language: 'JavaScript', size: 'w' },
      { id: 'p-ig', type: 'social', platform: 'instagram', handle: 'ada', size: 's' },
      { id: 'p-mail', type: 'social', platform: 'email', handle: 'hi@ada.dev', size: 's' },
      { id: 'p-note', type: 'text', text: 'Open to **new projects** in June.', size: 'w' },
    ],
  });

  return (
    <div className="posy-page posy-bg-mesh posy-grain posy-motion min-h-dvh">
      <div aria-hidden className="posy-backdrop"><span className="posy-noise" /></div>
      <div className="relative z-10">
        <header className={`${wrap} flex items-center justify-between py-5`}>
          <a href="/" aria-label="Posy home"><Logo /></a>
          <nav className="flex items-center gap-1 text-[15px] font-medium sm:gap-2">
            <a href="#agents" className="hidden rounded-[12px] px-3 py-2 text-[var(--muted)] hover:text-[var(--text)] sm:block">Agents</a>
            <a href="#pricing" className="hidden rounded-[12px] px-3 py-2 text-[var(--muted)] hover:text-[var(--text)] sm:block">Pricing</a>
            <a href={GITHUB} target="_blank" rel="noopener" className="rounded-[12px] px-3 py-2 text-[var(--muted)] hover:text-[var(--text)]">GitHub</a>
            <a href="/login" className="rounded-[12px] px-3 py-2 text-[var(--muted)] hover:text-[var(--text)]">Log in</a>
          </nav>
        </header>

        <main>
          {/* Hero */}
          <section className="pb-10 pt-10 sm:pb-20 sm:pt-16">
            <div className={`${wrap} grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]`}>
              <div>
                <h1 className="posy-rise text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[64px]">One calm page for everything you make.</h1>
                <p className="posy-rise mt-5 max-w-[46ch] text-[18px] leading-relaxed text-[var(--muted)]" style={rise(1)}>
                  A link in bio with pastel themes, soft motion and an editor your AI agent can use. Free and open source.
                </p>
                <div className="posy-rise mt-8" style={rise(2)}><ClaimForm host={host} /></div>
                <p className="posy-rise mt-4 text-[15px] text-[var(--muted)]" style={rise(3)}>Free to start. No card.</p>
              </div>
              <div className="posy-rise relative mx-auto flex w-full max-w-[700px] justify-center lg:block" style={rise(2)}>
                <div className="hidden w-[550px] max-w-full lg:block"><Browser page={hero} host={host} /></div>
                <Phone page={phone} className="lg:absolute lg:-bottom-16 lg:right-[-12px] lg:rotate-[3deg]" />
              </div>
            </div>
          </section>

          {/* Theme switcher */}
          <Section title="Pick a mood. Change your mind." lead="Twelve pastel and dark themes, with fonts, backgrounds, tile styles and hover effects you can mix. Try a few.">
            <ThemeDemo options={demo} />
          </Section>

          {/* Paste a link */}
          <Section title="Paste a link. Get a tile." lead="Posy reads what you paste and picks the right tile: a repo with stars, a social profile, an email, a note. Then drag it where you want it.">
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-14">
              <div className="grid gap-3">
                {[['https://github.com/vercel/next.js', 'Repo tile with stars and language'], ['instagram.com/ada', 'Social tile with the brand colour'], ['hi@ada.dev', 'Email tile'], ['Open to new projects in June.', 'Note tile']].map(([input, out], i) => (
                  <div key={input} className="posy-rise grid gap-1 rounded-[20px] border border-[var(--line)] bg-[var(--surface)] px-5 py-4" style={rise(i)}>
                    <span className="flex items-center gap-2.5 break-all font-mono text-[14.5px]"><Link2 className="size-4 shrink-0 text-[var(--muted)]" />{input}</span>
                    <span className="flex items-center gap-2 pl-[26px] text-[15px] text-[var(--muted)]"><ArrowRight className="size-4" />{out}</span>
                  </div>
                ))}
              </div>
              <div className="mx-auto w-[min(100%,364px)] overflow-hidden rounded-[30px] border border-[var(--line)] p-3 shadow-[0_40px_80px_-44px_rgb(0_0_0/.45)]" style={{ background: THEMES.sky.bg }}>
                <div className="mx-auto w-[340px] max-w-full overflow-hidden rounded-[22px]"><Thumbnail page={pasted} width={390} height={440} scale={340 / 390} /></div>
              </div>
            </div>
          </Section>

          {/* Agents */}
          <Section id="agents" title="Your agent can edit your page." lead="Create an API key, connect Claude Code, Cursor or Codex over MCP, and ask in plain words. Edits land in your draft and show up live in the editor. Your agent publishes only when you ask.">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className={card}>
                <h3 className="flex items-center gap-2.5 text-[20px] font-semibold tracking-[-0.02em]"><KeyRound className="size-5" />Connect over MCP</h3>
                <p className="mb-5 mt-2 text-[15.5px] text-[var(--muted)]">Make a key in your dashboard, then add the server.</p>
                <AgentTabs site={site} />
              </div>
              <div className={card}>
                <h3 className="flex items-center gap-2.5 text-[20px] font-semibold tracking-[-0.02em]"><Sparkles className="size-5" />Then just ask</h3>
                <ul className="mt-5 grid gap-3">
                  {['Add my GitHub repo owner/name as a wide tile under a “Projects” section.', 'Switch my page to the lavender theme with an aurora backdrop and glass tiles, then publish.', 'Rewrite my bio to sound warmer and shorter. Show me before publishing.'].map(p => (
                    <li key={p} className="rounded-[16px] bg-[var(--secondary)] px-4 py-3.5 text-[15.5px] leading-snug">{p}</li>
                  ))}
                </ul>
                <p className="mt-5 text-[15px] leading-relaxed text-[var(--muted)]">Every page also has a plain <code className="font-mono text-[14px]">/llms.txt</code> and JSON, so other agents can read it.</p>
              </div>
            </div>
          </Section>

          {/* Open source */}
          <Section title="Open source. You own it." lead="Your page is one JSON file. Download it whenever you like, or run all of Posy on your own server.">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className={card}>
                <h3 className="flex items-center gap-2.5 text-[20px] font-semibold tracking-[-0.02em]"><Download className="size-5" />Export in one click</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-[var(--muted)]">Settings has a button that downloads <code className="font-mono text-[14px]">page.json</code>: profile, theme and tiles, with a public schema. Nothing is held back.</p>
              </div>
              <div className={card}>
                <h3 className="flex items-center gap-2.5 text-[20px] font-semibold tracking-[-0.02em]"><Server className="size-5" />Self-host with Docker</h3>
                <p className="mb-4 mt-2 text-[15.5px] leading-relaxed text-[var(--muted)]">Same editor, same agents, your data in one volume.</p>
                <div className="overflow-x-auto rounded-[16px] bg-[#1d1a17] px-4 py-3.5 text-[13px] leading-relaxed text-[#f3ece4]">
                  <pre><code>{`docker build -t posy .\ndocker run -p 3000:3000 -v posy-data:/data \\\n  -e BETTER_AUTH_SECRET=... posy`}</code></pre>
                </div>
              </div>
            </div>
          </Section>

          {/* Pricing */}
          <Section id="pricing" title="Simple pricing." lead="There are two ways to use Posy, and both are free.">
            <div className="grid gap-5 md:grid-cols-2">
              {[
                { name: 'Free', price: '$0', note: 'On our servers, nothing to run.', items: ['Your page at ' + host + '/you', 'Studio, themes, fonts and backgrounds', 'Every tile type, drag and drop', 'API key and MCP server for your agents', 'JSON export any time'], cta: 'Claim your name', href: '/signup' },
                { name: 'Self-host free forever', price: '$0', note: 'On your own server.', items: ['The full open-source app', 'Docker image and one data volume', 'Your data, your domain, your rules', 'MIT-licensed code you can read and change'], cta: 'View on GitHub', href: GITHUB },
              ].map((p, i) => (
                <div key={p.name} className={`${card} posy-rise flex flex-col`} style={rise(i)}>
                  <h3 className="text-[22px] font-semibold tracking-[-0.025em]">{p.name}</h3>
                  <p className="mt-3 text-[44px] font-semibold leading-none tracking-[-0.04em]">{p.price}</p>
                  <p className="mt-2 text-[15.5px] text-[var(--muted)]">{p.note}</p>
                  <ul className="my-7 grid gap-3 text-[15.5px]">{p.items.map(it => <li key={it} className="flex gap-3"><Check className="mt-0.5 size-[18px] shrink-0" />{it}</li>)}</ul>
                  <a href={p.href} {...(p.href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})}
                    className={`mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-[16px] text-[15.5px] font-medium transition-transform hover:-translate-y-0.5 ${i === 0 ? 'bg-[var(--text)] text-[var(--surface)]' : 'border border-[var(--line)] bg-[var(--surface)]'}`}>
                    {p.cta}<ArrowRight className="size-4" />
                  </a>
                </div>
              ))}
            </div>
          </Section>

          {/* FAQ */}
          <Section title="Questions">
            <div className="max-w-[760px] divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {[
                ['Is Posy really free?', 'Yes. The hosted version is free, and the code is open source, so you can run it yourself at no cost.'],
                ['Can I leave?', 'Any time. Download your page as JSON from Settings, or self-host Posy and bring the file with you.'],
                ['What can my AI agent do?', 'Read your page, add, edit, move and remove tiles, change the theme and profile, and publish. It works through your own API key, which you can revoke whenever you like.'],
                ['Will an agent publish by accident?', 'No. Agent edits go to your draft first. Nothing goes live until it calls publish, which it does when you ask.'],
                ['Does it work without JavaScript?', 'Pages are server-rendered, so visitors see everything straight away. Motion is a bonus on top.'],
              ].map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[18px] font-medium tracking-[-0.015em] [&::-webkit-details-marker]:hidden">
                    {q}<span aria-hidden className="text-[24px] font-light text-[var(--muted)] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-[var(--muted)]">{a}</p>
                </details>
              ))}
            </div>
          </Section>

          {/* Final CTA */}
          <section className="pb-16 pt-6 sm:pb-24">
            <div className={wrap}>
              <div className={`${card} flex flex-col items-start gap-6 sm:p-12`}>
                <h2 className="max-w-[18ch] text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[44px]">Your name is waiting.</h2>
                <ClaimForm host={host} id="claim-end" />
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-[var(--line)] py-10">
          <div className={`${wrap} flex flex-col items-start justify-between gap-5 text-[15px] text-[var(--muted)] sm:flex-row sm:items-center`}>
            <Logo className="text-[var(--text)]" />
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href="#agents" className="hover:text-[var(--text)]">Agents</a>
              <a href="#pricing" className="hover:text-[var(--text)]">Pricing</a>
              <a href="/llms.txt" className="hover:text-[var(--text)]">llms.txt</a>
              <a href={GITHUB} target="_blank" rel="noopener" className="inline-flex items-center gap-2 hover:text-[var(--text)]">
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden><path d={siGithub.path} /></svg>GitHub
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
