export const INSTALL_LINKS = [
  { id: 'claude', name: 'Claude', logo: 'claude', href: 'https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=Posy&connectorUrl=https%3A%2F%2Fposy.page%2Fapi%2Fmcp' },
  { id: 'cursor', name: 'Cursor', logo: 'cursor', href: 'https://cursor.com/install-mcp?name=posy&config=eyJ1cmwiOiJodHRwczovL3Bvc3kucGFnZS9hcGkvbWNwIn0%3D' },
  { id: 'vscode', name: 'VS Code', logo: 'visualstudiocode', href: 'https://vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522posy%2522%252C%2522type%2522%253A%2522http%2522%252C%2522url%2522%253A%2522https%253A%252F%252Fposy.page%252Fapi%252Fmcp%2522%257D' },
  { id: 'vscode-insiders', name: 'VS Code Insiders', logo: 'visualstudiocode', href: 'https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522posy%2522%252C%2522type%2522%253A%2522http%2522%252C%2522url%2522%253A%2522https%253A%252F%252Fposy.page%252Fapi%252Fmcp%2522%257D' },
  { id: 'goose', name: 'Goose', logo: 'goose', href: 'goose://extension?type=streamable_http&url=https%3A%2F%2Fposy.page%2Fapi%2Fmcp&id=posy&name=Posy&description=Make%20and%20edit%20your%20Posy%20page' },
  { id: 'lmstudio', name: 'LM Studio', logo: 'lmstudio', href: 'lmstudio://add_mcp?name=posy&config=eyJ1cmwiOiJodHRwczovL3Bvc3kucGFnZS9hcGkvbWNwIn0%3D' },
];

export const INSTALL_COPIES = [
  { id: 'claude-code', name: 'Claude Code', logo: 'claude', copy: 'claude mcp add --transport http posy https://posy.page/api/mcp', hint: 'Paste it in your terminal, then run /mcp in Claude Code and choose Authenticate.' },
  { id: 'codex', name: 'Codex', logo: 'openai', copy: 'codex mcp add posy --url https://posy.page/api/mcp', hint: 'Paste it in your terminal, then run codex mcp login posy to sign in.' },
  { id: 'chatgpt', name: 'ChatGPT', logo: 'openai', copy: 'https://posy.page/api/mcp', hint: 'In ChatGPT: Settings, Apps & Connectors, Advanced, turn on Developer mode, then Create. Paste the URL and choose OAuth.' },
  { id: 'windsurf', name: 'Windsurf', logo: 'windsurf', copy: '{ "mcpServers": { "posy": { "serverUrl": "https://posy.page/api/mcp" } } }', hint: 'Add it to ~/.codeium/windsurf/mcp_config.json, then refresh MCP servers in Cascade.' },
  { id: 'zed', name: 'Zed', logo: 'zedindustries', copy: '{ "context_servers": { "posy": { "url": "https://posy.page/api/mcp" } } }', hint: 'Add it to Zed\'s settings.json (zed: open settings).' },
];

export const InstallButtons = ({ compact = false }) => {
  const logo = name => {
    const src = `url(/images/apps/${name}.svg)`;
    return <span className="posy-app-logo" aria-hidden="true" style={{ WebkitMaskImage: src, maskImage: src }} />;
  };
  const [picked, setPicked] = useState(null);
  const [copied, setCopied] = useState(false);
  const shown = INSTALL_COPIES.find(c => c.id === picked);

  const pick = item => {
    setPicked(item.id);
    setCopied(false);
    navigator.clipboard?.writeText(item.copy).then(() => setCopied(true), () => {});
  };

  const links = compact ? INSTALL_LINKS.filter(l => ['claude', 'cursor', 'vscode'].includes(l.id)) : INSTALL_LINKS;
  const copies = compact ? INSTALL_COPIES.filter(c => c.id === 'claude-code') : INSTALL_COPIES;

  return (
    <div className={compact ? 'posy-install posy-install-compact' : 'posy-install'}>
      {!compact && <p className="posy-install-label">One click</p>}
      <div className="posy-install-row">
        {links.map(l => (
          <a key={l.id} className="posy-install-btn" href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
            {logo(l.logo)}
            <span>{l.name}</span>
          </a>
        ))}
        {compact && copies.map(c => (
          <button key={c.id} type="button" className={picked === c.id ? 'posy-install-btn is-picked' : 'posy-install-btn'} onClick={() => pick(c)}>
            {logo(c.logo)}
            <span>{c.name}</span>
          </button>
        ))}
      </div>
      {!compact && <p className="posy-install-label">Copy and paste</p>}
      {!compact && (
        <div className="posy-install-row">
          {copies.map(c => (
            <button key={c.id} type="button" className={picked === c.id ? 'posy-install-btn is-picked' : 'posy-install-btn'} onClick={() => pick(c)}>
              {logo(c.logo)}
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}
      {shown && (
        <div className="posy-install-note" role="status">
          <code>{shown.copy}</code>
          <span>{copied ? 'Copied. ' : ''}{shown.hint}</span>
        </div>
      )}
      {!compact && <p className="posy-install-foot">These add the hosted server at posy.page. Each app asks you to sign in to Posy. For your own server, use the steps below with your URL.</p>}
    </div>
  );
};
