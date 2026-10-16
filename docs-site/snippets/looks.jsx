export const LOOKS = [
  {
    id: 'desk', slug: 'cozy', name: 'Desk', free: true,
    note: 'Polaroids and notes in the afternoon sun.',
    special: 'Your tiles become things on a wooden desk: a polaroid for your photo, a postcard for your newsletter, luggage tags for links, washi tape holding it all down, all in warm afternoon light. It is a free canvas, so you put things where you want them.',
    layout: 'Canvas',
    palettes: [
      { name: 'Cream', bg: '#f6f1e9', surface: '#fffcf7', ink: '#2b2621', accent: '#bc774c' },
      { name: 'Oak', bg: '#e8dccb', surface: '#f7f1e6', ink: '#2b241d', accent: '#a5683f' },
      { name: 'Sage', bg: '#eef1ea', surface: '#fbfcf8', ink: '#232820', accent: '#739064' },
      { name: 'Slate', bg: '#1f2124', surface: '#2a2d31', ink: '#ece8e1', accent: '#e0a96d' },
    ],
  },
  {
    id: 'washi', slug: 'washi', name: 'Washi', free: false,
    note: 'Paper, ink and a red seal.',
    special: 'Soft mulberry paper, brush-ink headings and a red hanko stamped next to your name. Tiles sit in a calm bento grid with lots of white space, so a short list of links still feels considered.',
    layout: 'Bento',
    palettes: [
      { name: 'Kinari', bg: '#f1ebdf', surface: '#f8f4ec', ink: '#1e1b17', accent: '#c8402b' },
      { name: 'Sakura', bg: '#f4e7e4', surface: '#faf3f1', ink: '#2a1d1c', accent: '#c23a4b' },
      { name: 'Yomogi', bg: '#e3e6d8', surface: '#f1f2ea', ink: '#1f241c', accent: '#b5432e' },
      { name: 'Sumi', bg: '#1a1917', surface: '#22211e', ink: '#ece6da', accent: '#d4533b' },
    ],
  },
  {
    id: 'lofi', slug: 'lofi', name: 'Lofi', free: false,
    note: 'A desktop left open, with windows you can drag.',
    special: 'Your page is a little computer desktop. Every tile is a window with a title bar, and visitors can drag them around. Thick outlines and flat colour make it feel like a late-night playlist.',
    layout: 'Canvas',
    palettes: [
      { name: 'Daydream', bg: '#eeeefb', surface: '#ffffff', ink: '#121212', accent: '#ff3d9a' },
      { name: 'Night', bg: '#121a33', surface: '#18213f', ink: '#e8ebff', accent: '#8f7cff' },
      { name: 'Violet hour', bg: '#170f2b', surface: '#1f1638', ink: '#f1eaff', accent: '#c77dff' },
      { name: 'Last train', bg: '#1f1426', surface: '#281b31', ink: '#ffe9e4', accent: '#ff8a7a' },
    ],
  },
  {
    id: 'painted', slug: 'painted', name: 'Painted', free: false,
    note: 'Watercolour paper under a painted sky.',
    special: 'The closest look to this site: big soft clouds painted behind your page, and tiles on watercolour paper with deckled edges. Four skies, from morning blue to a starry night.',
    layout: 'Bento',
    palettes: [
      { name: 'Morning', bg: '#dbe9f3', surface: '#fbf7ef', ink: '#26313a', accent: '#d9553a' },
      { name: 'Golden hour', bg: '#f6dfc4', surface: '#fdf7ee', ink: '#3a2a20', accent: '#c8572f' },
      { name: 'Dusk', bg: '#e6d6e6', surface: '#fcf6f3', ink: '#2e2534', accent: '#b8456a' },
      { name: 'Starry', bg: '#14203b', surface: '#f6f0e4', ink: '#eef0f8', accent: '#f2c46b' },
    ],
  },
  {
    id: 'cobalt', slug: 'cobalt', name: 'Cobalt', free: true,
    note: 'A vintage print in two inks, under a crescent moon.',
    special: 'Everything is printed in two inks on cream stock, like an old travel poster. Photos turn into halftone duotones that match the palette, and a crescent moon hangs over your name.',
    layout: 'Bento',
    palettes: [
      { name: 'Cobalt', bg: '#ece2cb', surface: '#f6eedb', ink: '#1a2d8f', accent: '#2442c4' },
      { name: 'Vermilion', bg: '#efe4cf', surface: '#f8efde', ink: '#2b1d18', accent: '#cf3b25' },
      { name: 'Moonlit', bg: '#0f1d57', surface: '#172a75', ink: '#f1e5c9', accent: '#f3d58c' },
      { name: 'Verdigris', bg: '#e7e2cf', surface: '#f2eddd', ink: '#17463f', accent: '#2c7a69' },
    ],
  },
  {
    id: 'night', slug: 'night', name: 'Night', free: false,
    note: 'A netrunner\u2019s HUD after dark.',
    special: 'Scanned photos, cut-corner panels and one signal colour on near black. Tiles read like readouts on a heads-up display, with a rainy alley glowing behind them. Daylight flips it to ink on yellow.',
    layout: 'Bento',
    palettes: [
      { name: 'Netrunner', bg: '#0b0b08', surface: '#121210', ink: '#ecead6', accent: '#f3e600' },
      { name: 'Ice', bg: '#03080e', surface: '#08131d', ink: '#dcf7ff', accent: '#45efff' },
      { name: 'Redline', bg: '#0c0505', surface: '#150a0a', ink: '#ffe8e2', accent: '#ff3b2f' },
      { name: 'Daylight', bg: '#f2e400', surface: '#f7ec42', ink: '#0b0b08', accent: '#0b0b08' },
    ],
  },
];

export const LooksStrip = () => (
  <div className="posy-strip not-prose">
    {LOOKS.map(l => (
      <a key={l.id} href={`/looks#${l.id}`} className="posy-strip-item">
        <span className="posy-strip-shot">
          <img src={`/images/looks/${l.id}-phone.webp`} alt={`The ${l.name} look`} loading="lazy" noZoom />
        </span>
        <span className="posy-strip-label">
          <span className="posy-strip-name">{l.name}</span>
          <span className={l.free ? 'posy-pill posy-pill-free' : 'posy-pill posy-pill-pro'}>{l.free ? 'Free' : 'Pro'}</span>
        </span>
      </a>
    ))}
  </div>
);

export const LookStage = ({ id }) => {
  const l = LOOKS.find(x => x.id === id);
  return (
    <div className="posy-look not-prose">
      <p className="posy-look-note">
        <span className={l.free ? 'posy-pill posy-pill-free' : 'posy-pill posy-pill-pro'}>{l.free ? 'Free' : 'Pro'}</span>
        <span className="posy-pill posy-pill-quiet">{l.layout}</span>
        <em>{l.note}</em>
      </p>
      <div className="posy-stage">
        <div className="posy-browser">
          <div className="posy-browser-bar"><i /><i /><i /><span>posy.page/mira</span></div>
          <img src={`/images/looks/${l.id}-desktop.webp`} alt={`${l.name} on a desktop`} loading="lazy" />
        </div>
        <div className="posy-phone">
          <img src={`/images/looks/${l.id}-phone.webp`} alt={`${l.name} on a phone`} loading="lazy" />
        </div>
      </div>
      <p className="posy-look-special">{l.special}</p>
      <div className="posy-palettes">
        {l.palettes.map((p, i) => (
          <div key={p.name} className="posy-swatch" title={`${p.name}: ${p.bg} / ${p.accent}`}>
            <span className="posy-swatch-chip" style={{ background: p.bg }}>
              <span className="posy-swatch-card" style={{ background: p.surface, color: p.ink }}>Aa</span>
              <span className="posy-swatch-dot" style={{ background: p.accent }} />
            </span>
            <span className="posy-swatch-name">{p.name}{i === 0 ? <small>default</small> : null}</span>
            <code className="posy-swatch-hex">{p.accent}</code>
          </div>
        ))}
      </div>
      <p className="posy-look-use">
        <code>{`look: "${l.slug}"`}</code> in a <a href="/agents/format">page file</a>, or <code>{`style: "${l.slug}"`}</code> in the <a href="/api-reference/introduction">API</a>.
      </p>
    </div>
  );
};
