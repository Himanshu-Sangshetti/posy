# Connect an AI to Posy

Posy has a hosted MCP server, so an AI can make and edit your page: "make me a link in bio page", "add my latest video", "switch to the dark look".
Everything an AI does lands in your **draft**. Nothing goes live until you (or it, when you ask) publish.

The server is `https://YOUR-POSY/api/mcp`. On the hosted Posy that is `https://posy.page/api/mcp`. You sign in with your Posy account, so there is no key to copy.

<!-- docs-site: install-buttons -->

## Claude (claude.ai, Desktop and mobile)

Settings → Connectors → **Add custom connector** → name it Posy, paste the URL, then sign in to Posy when asked.

## ChatGPT

Settings → Apps & Connectors → Advanced → turn on Developer mode → **Create** → paste the URL, choose OAuth, and sign in to Posy.

## Claude Code

```bash
claude mcp add --transport http posy https://YOUR-POSY/api/mcp
```

Then run `/mcp` inside Claude Code and choose **Authenticate**. Or install the plugin, which adds a "make a page" skill:

```
/plugin marketplace add Himanshu-Sangshetti/posy
/plugin install posy@posy
```

## Cursor, VS Code, Codex

- **Cursor:** use the one-click install, or add the config below by hand.
- **VS Code:** `code --add-mcp '{"name":"posy","type":"http","url":"https://YOUR-POSY/api/mcp"}'`
- **Codex:** `codex mcp add posy --url https://YOUR-POSY/api/mcp`

<!-- docs-site: skip -->
### Cursor: one click

[Add Posy to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=posy&config=eyJ1cmwiOiJodHRwczovL3Bvc3kucGFnZS9hcGkvbWNwIn0=)

That link installs `https://posy.page/api/mcp`. Cursor then asks you to sign in to Posy. For your own server, use the config below.
<!-- /docs-site: skip -->

### A config file

Cursor reads `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project). Other tools use `.mcp.json` in the project folder. Add this:

```json
{
  "mcpServers": {
    "posy": { "url": "https://posy.page/api/mcp" }
  }
}
```

In Claude Code's `.mcp.json`, add `"type": "http"` next to `url`. On your own server, change the URL to `https://YOUR-POSY/api/mcp`.

## An API key instead

Scripts and tools that cannot open a browser can use a key from the dashboard's **Agents** page:

```bash
claude mcp add --transport http posy https://YOUR-POSY/api/mcp --header "Authorization: Bearer posy_..."
```

## No connector? Use a file

Any chat can write your page as a small JSON file, which you load at `/new`. See [the page file](/docs/format).

## What an AI can do

| tool | what it does |
|---|---|
| `get_page` | Your draft, public URL, and what to do next. |
| `create_page` | Claim a username and create your page (once). |
| `import_page` | Load a whole page from a [page file](/docs/format). |
| `add_tile` | Add one link, or many at once with `inputs`. Posy picks the right tile. |
| `update_tile`, `move_tile`, `remove_tile` | Change, reorder or delete a tile. |
| `set_theme`, `set_profile` | Look, colours, fonts, name and bio. |
| `publish` | Make the draft live. |
| `list_options` | Allowed looks, themes, fonts and sizes. |

The looks an agent can pick (`style`): `cozy` (Desk), `washi`, `lofi`, `painted`, `cobalt` and `night`. On posy.page, Desk and Cobalt are free and the other four come with Pro.

More: [the full guide](https://github.com/Himanshu-Sangshetti/posy/blob/main/docs/ai-agents.md).
