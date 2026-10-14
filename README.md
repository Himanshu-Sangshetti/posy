<p align="center">
  <img src="docs/media/hero.webp" alt="A Posy desk page: a polaroid, a sticky note, a stamp and a record on a soft pastel desk" width="900">
</p>

<h1 align="center">Posy</h1>

<p align="center">A beautiful link-in-bio page you actually own.<br>Pastel themes, soft motion, one JSON file. Free and open source.</p>

---

Posy makes a link-in-bio page that looks like a desk: polaroids, sticky notes, a record that spins.
It is open source, and there are two ways to use it.

## Two ways to use Posy

**Run it yourself.** Download Posy and host it on your own server or domain. Everything is
unlocked: every layout, theme and font, analytics with CSV export, your own domain, no badge to remove.
The first account you create owns the instance, and `/` is your page.

**Use posy.page.** The same app, hosted by us. Sign up and your page is live in a minute. Nothing to
install, update or back up. There is a free plan, and Pro ($5/month or $48/year) adds the extras below.

| | Self-hosted | posy.page Free | posy.page Pro |
|---|---|---|---|
| Layouts, tiles, editor, API, MCP, CLI | All | All | All |
| Premium themes and fonts | Yes | No | Yes |
| Your own domain | Yes, point it at your server | No | Yes, HTTPS set up for you |
| Analytics | 12 months + CSV | Basic | 12 months + CSV |
| "Made with Posy" footer | Hide it | Shown | Hide it |
| Setup and upkeep | You | None | None |
| Support | GitHub issues | GitHub issues | Priority |

<p align="center">
  <img src="docs/media/studio.webp" alt="The Posy studio with the Design panel open" width="900">
</p>

### Moving between them

Your page is one JSON file, and it works the same on both. In **Settings**, press **Download page.json**
on one and **Import page.json** on the other. The import lands in your draft, so nothing changes
on your live page until you press Publish. Photos you uploaded are saved as full links, so they keep
loading from the old server; keep it running until you have re-uploaded them.

The REST API, the MCP server and the CLI are the same on both too. Point `POSY_URL` at whichever one you use:

```bash
POSY_URL=https://posy.page POSY_API_KEY=posy_... npm run posy -- export page.json
POSY_URL=https://my.server POSY_API_KEY=posy_... npm run posy -- import page.json
```

## Run it yourself

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FHimanshu-Sangshetti%2Fposy&env=BETTER_AUTH_SECRET,NEXT_PUBLIC_SITE_URL,BETTER_AUTH_URL,DATABASE_URL,DATABASE_AUTH_TOKEN,BLOB_READ_WRITE_TOKEN&envDescription=Secret%20(openssl%20rand%20-base64%2032)%2C%20your%20public%20URL%2C%20a%20Turso%20database%20and%20a%20Vercel%20Blob%20token&envLink=https%3A%2F%2Fgithub.com%2FHimanshu-Sangshetti%2Fposy%2Fblob%2Fv2%2Fdocs%2Fself-hosting.md)

### Docker

```bash
docker build -t posy .
docker run -p 3000:3000 -v posy-data:/data \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  -e BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
  posy
```

Or `docker compose up` (change `BETTER_AUTH_SECRET` in `docker-compose.yml` first). Open
http://localhost:3000 and sign up. **The first account owns the instance, then sign-ups close.**
Data (SQLite) lives in the `/data` volume, and migrations run on start.

Docker Compose, Vercel with Turso and Blob, custom domains, backups and upgrades are in
[docs/self-hosting.md](docs/self-hosting.md).

### From source

```bash
npm install
npm run dev        # http://localhost:3000
```

Everything is optional locally; see [.env.example](.env.example).

### Configuration

| Variable | Default | What it does |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Public URL (share links, OG images) |
| `BETTER_AUTH_URL` / `BETTER_AUTH_SECRET` | | Required in production. Secret: `openssl rand -base64 32` |
| `POSY_SIGNUP` | `first-user` | `open` lets anyone sign up, `closed` disables sign-up |
| `POSY_DATA_DIR` | `~/.posy` in dev, `.data` in production (`/data` in Docker) | Where the SQLite file and uploads live |
| `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | local file | Use Turso / libSQL instead |
| `BLOB_READ_WRITE_TOKEN` | | Vercel Blob for uploads on Vercel |
| `GITHUB_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET` | | Enable social sign-in |
| `GITHUB_TOKEN` | | Higher GitHub API limit for repo tiles |

## Using the studio

Sign in and open **Edit**.

| | |
|---|---|
| **Add** | Press <kbd>Add</kbd>, or paste a link anywhere on the page. Profiles, YouTube, Spotify, GitHub repos, images and emails are recognised automatically. |
| **Arrange** | Drag tiles. Pick a size: small, wide, tall or large. |
| **Style** | Theme, backgrounds, tile styles, fonts, corners and layout, from the palette button. |
| **Undo** | <kbd>⌘Z</kbd> / <kbd>⇧⌘Z</kbd>. <kbd>Delete</kbd> removes the selected tile, <kbd>Esc</kbd> deselects. |
| **Publish** | Edits are saved to a draft. **Publish** makes them live. |
| **Share** | QR code and link for your page. |

Dashboard pages: **Analytics** (views and clicks per tile), **Agents** (API keys and setup snippets),
**Settings** (change username, download or import your page as JSON, delete your account).

<p align="center">
  <img src="docs/media/add.webp" alt="Adding a tile by pasting a link" width="900">
</p>

## Themes

Cream · Lavender · Mint · Sky · Peach · Paper · Blush · Sage · Midnight · Mocha · Dusk · Ocean, plus any accent colour, backgrounds, tile styles, hover effects and font pairs.

<p align="center">
  <img src="docs/media/themes.webp" alt="The same desk page in cream, lavender, midnight and mint" width="900">
</p>

## Tiles

| Tile | What it shows |
|---|---|
| Link | Favicon, title and an optional preview image |
| Social | 29 platforms (X, Instagram, GitHub, LinkedIn, YouTube, TikTok, Bluesky, Threads, Substack…) and email |
| Note | Short text with **bold**, *italic* and links |
| Section | A heading that starts a new group of tiles |
| Image | Your photo or artwork, with an optional caption and link |
| Video | YouTube, loads only when played |
| Music | Spotify embed |
| GitHub | A repo with live stars and language, refreshed daily |

## Edit with your AI agent

Create an API key on the **Agents** page, then connect your agent to the hosted MCP server:

```bash
claude mcp add --transport http posy http://localhost:3000/api/mcp \
  --header "Authorization: Bearer posy_..."
```

Ask it, for example, *"add my repo owner/name as a wide tile and switch to the lavender theme, then
publish"*. If the studio is open, the change appears within seconds. There's also a REST API
(`/api/v1/page`), a public JSON view of any page (`/api/v1/public/<username>`), `llms.txt` pages,
and a CLI:

```bash
export POSY_URL=http://localhost:3000 POSY_API_KEY=posy_...
npm run posy -- add https://x.com/you
npm run posy -- theme --preset midnight --tiles glass
npm run posy -- publish
```

See [docs/ai-agents.md](docs/ai-agents.md).

## Deploying

Docker, Docker Compose, Vercel or any Node host. Step by step in [docs/self-hosting.md](docs/self-hosting.md).

## Built with

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Motion · dnd-kit · shadcn/ui · Better Auth ·
Drizzle + libSQL · Zod · MCP

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
