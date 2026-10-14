<p align="center">
  <img src="docs/media/hero.webp" alt="A Posy page: profile on the left, pastel tiles on the right" width="900">
</p>

<h1 align="center">Posy</h1>

<p align="center">A beautiful link-in-bio page you actually own.<br>Pastel themes, soft motion, one JSON file. Free and open source.</p>

---

When Linktree bought Bento and shut it down, a lot of people lost a page they loved. Posy is the
page that can't be taken away: it builds to plain static files you can host anywhere for free,
and the whole page lives in one file you control.

- **Looks good by default.** Eight pastel and dark themes, four font pairs, soft spring animations.
- **A calm editor.** Paste any link and it becomes the right tile. Drag to reorder. Click to edit. That's it.
- **Yours forever.** Static export to GitHub Pages, Vercel, Netlify or any web server. No account, no lock-in.
- **Agent friendly.** One `page.json` with a JSON Schema, a CLI, and a studio that updates live when your agent edits the file.
- **Fast.** Server-rendered, works with JavaScript turned off, entrance animations in pure CSS.

<p align="center">
  <img src="docs/media/studio.webp" alt="The Posy studio with the theme panel open" width="900">
</p>

## Get your page

1. Click **Use this template** on GitHub (or fork the repo).
2. In your new repo: **Settings → Pages → Source: GitHub Actions**.
3. Edit your page (below), push, and it's live at `https://<you>.github.io/<repo>/`.

Want your own domain? Add it under Settings → Pages. It's free.

## Edit your page

```bash
npm install
npm run dev
```

Open **http://localhost:3000/edit**. Everything you change is saved to `content/page.json`.

| | |
|---|---|
| **Add** | Press <kbd>Add</kbd>, or paste a link anywhere on the page. Profiles, YouTube, Spotify, GitHub repos, images and emails are recognised automatically. |
| **Arrange** | Drag tiles. Pick a size: small, wide, tall or large. |
| **Style** | Theme, accent colour, font, corners, layout, from the palette button. |
| **Undo** | <kbd>⌘Z</kbd> / <kbd>⇧⌘Z</kbd>. <kbd>Delete</kbd> removes the selected tile, <kbd>Esc</kbd> deselects. |
| **Share** | Set your page's address to get a QR code. |

Drop images straight onto the page to add them. They're resized and saved into `public/uploads`.

<p align="center">
  <img src="docs/media/add.webp" alt="Adding a tile by pasting a GitHub link" width="900">
</p>

## Themes

Cream · Lavender · Mint · Sky · Peach · Paper · Midnight · Mocha, plus any accent colour.

<p align="center">
  <img src="docs/media/themes.webp" alt="All eight Posy themes" width="900">
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

Ask Claude Code, Cursor or Codex to change `content/page.json`, e.g. *"add my repo owner/name as a
wide tile under Projects and switch to the lavender theme"*. If the studio is open, the change appears
within a second. See [docs/ai-agents.md](docs/ai-agents.md) for the rules agents should follow.

There's also a CLI:

```bash
npm run posy -- add https://x.com/you
npm run posy -- add owner/repo --size w
npm run posy -- theme midnight --font soft
npm run posy -- validate
```

## Deploying elsewhere

```bash
npm run build      # static site in out/
```

Upload `out/` anywhere. On Vercel or Netlify, import the repo and keep the defaults.

For share previews (the image shown when your link is posted), set `seo.url` in `page.json` to your
page's address. The GitHub Pages workflow does this for you.

To host a try-it-yourself editor (it saves to the visitor's browser), build with `POSY_PLAYGROUND=1`.

## Built with

Next.js 16 (static export) · React 19 · TypeScript · Tailwind CSS 4 · Motion · dnd-kit · shadcn/ui ·
Zustand · Zod · Simple Icons

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
