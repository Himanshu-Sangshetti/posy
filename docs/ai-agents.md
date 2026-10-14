# Editing Posy with an AI agent

Posy keeps your whole page in one file, `content/page.json`, described by a JSON Schema at
`schema/page.schema.json`. That makes it easy for Claude Code, Cursor, Codex or any other agent to
edit your page safely.

## Prompts that work

> Add my GitHub repo `owner/name` as a wide tile under "Projects".

> Switch the theme to lavender with the rounded font and the centred layout.

> Make a "Writing" section with links to my three latest posts: …

> Reorder the tiles so my newest project comes first.

If the studio is open (`npm run dev`, then `/edit`), it picks up the agent's changes within a second
or two. The studio refuses to overwrite a file that changed underneath it, so you and your agent can
work at the same time.

## Rules for agents

1. Edit `content/page.json` only. Keep `"$schema"` at the top.
2. Every tile needs a unique `id` (for example `"t-" + 7 random characters`) and a `type`.
3. Sizes: `s` (1×1), `w` (2×1), `t` (1×2), `l` (2×2). `heading` tiles start a new section.
4. Colours: `auto`, `surface`, `accent` or a pastel tint (`peach`, `butter`, `mint`, `sky`, `lilac`, `rose`).
5. Run `npm run posy -- validate` after editing. It prints the exact field that's wrong.

## Tile types

| type | required fields | notes |
|---|---|---|
| `link` | `url` | optional `title`, `description`, `image` |
| `social` | `platform`, `handle` | platforms are listed in the schema; `email` works too |
| `text` | `text` | supports `**bold**`, `*italic*` and `[links](https://…)` |
| `heading` | `text` | section title, always full width |
| `image` | `src` | local files go in `public/` and are referenced as `/file.jpg` |
| `video` | `url` | YouTube |
| `music` | `url` | Spotify track, album, playlist, artist or show |
| `github` | `repo` (`owner/name`) | stars, description and language are filled in at build time |

## The CLI

Agents that prefer commands can use the CLI instead of editing JSON by hand:

```bash
npm run posy -- add https://github.com/owner/repo --size w
npm run posy -- add "Open to freelance work" --color mint
npm run posy -- theme midnight --font soft --layout split
npm run posy -- list
npm run posy -- remove t-abc1234
npm run posy -- validate
```

`add` understands profile links (X, Instagram, GitHub, LinkedIn, YouTube, Bluesky and 20+ more),
YouTube and Spotify links, image URLs, `owner/repo`, email addresses and plain text.
