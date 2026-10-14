# Changelog

## 2.0.0 — 2026-10-14

Posy is now a product you can sign up for or host yourself.

- Accounts (email + password, GitHub/Google when configured), claim `/<username>`, draft then Publish.
- Per-user OG image, favicon, `llms.txt` and public JSON.
- Cloud studio with a rebuilt design panel: backgrounds, tile styles, hover effects, more font pairs, list layout.
- Agents: API keys, REST API, hosted MCP server at `/api/mcp`, live sync into the open studio.
- Dashboard: analytics (views and clicks per tile), Agents, Settings (rename, export JSON, delete account).
- Self-hosting: Docker image, migrations on start, `POSY_SIGNUP` (first user owns the instance by default).
- Static-export and `content/page.json` mode is gone; export your page as JSON from Settings instead.

## 1.0.0 — 2026-10-14

First release.

- Bento-style tile page with four sizes, sections, and a profile that sits beside the grid or above it.
- Tiles: link, social (29 platforms + email), note, section title, image, YouTube, Spotify, GitHub repo.
- Eight themes (Cream, Lavender, Mint, Sky, Peach, Paper, Midnight, Mocha), custom accent, four font pairs, three corner styles.
- Studio at `/edit`: paste any link to add a tile, drag to reorder, inline editing, undo/redo, autosave, mobile preview, QR code.
- Live sync: edits to `content/page.json` (by you or an AI agent) appear in the open studio.
- JSON Schema and a CLI (`npm run posy`) for agents and scripts.
- Static export that works with JavaScript disabled; GitHub Pages workflow with daily refresh; playground build.
