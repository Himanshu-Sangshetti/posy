# Editing Posy with an AI agent

Every Posy account, self-hosted or on posy.page, has an API key page (**Agents** in the dashboard), a hosted MCP server, a REST API
and a CLI. Agents edit your **draft**; nothing goes live until `publish` is called.

## Connect

1. Create a key on the **Agents** page (it's shown once).
2. Connect your agent:

```bash
# Claude Code
claude mcp add --transport http posy https://YOUR-POSY/api/mcp --header "Authorization: Bearer posy_..."
```

Cursor, Codex and other MCP clients: add an HTTP server at `https://YOUR-POSY/api/mcp` with the header
`Authorization: Bearer posy_...`. The Agents page has copy-paste snippets for each.

`YOUR-POSY` is your own server or `posy.page`. The API, MCP server and CLI behave the same on both, so a script written for one works on the other by changing `POSY_URL`. `export` and `import` move a whole page between them.

## MCP tools

| tool | what it does |
|---|---|
| `get_page` | Draft (profile, theme, tiles with ids), public URL, version, unpublished-changes flag |
| `add_tile` | Add from a link, email, `owner/repo` or note (auto-detected), or a full tile object |
| `update_tile` / `remove_tile` / `move_tile` | Change fields, delete, reorder by id |
| `set_theme` | Preset, accent, font, radius, layout (`bento`, `list`, `canvas`), alignment, background, tile style, hover effect, avatar, photos (`natural`, `mono`, `dither`) |
| `set_profile` | Name, bio, avatar, location |
| `publish` | Make the draft live |
| `list_options` | Allowed values for themes, fonts, backgrounds, sizes, colours and platforms |

## Prompts that work

> Add my GitHub repo `owner/name` as a wide tile under "Projects", then publish.

> Switch to the lavender theme with an aurora background and glass tiles.

> Make a "Writing" section with links to my three latest posts: …

## Rules for agents

1. Start with `get_page`. Tiles have stable ids.
2. Sizes: `s` (1×1), `w` (2×1), `t` (1×2), `l` (2×2). `heading` tiles start a new section.
   On the default **desk** layout every tile is an object: images are polaroids, notes are sticky notes, Spotify is a record,
   YouTube is a ticket, GitHub repos are index cards, newsletter links (Substack, Buttondown, beehiiv…) are envelopes and
   links with a preview image are postcards. Social tiles become stickers under the name.
3. Colours: `auto`, `surface`, `accent` or a pastel tint (`peach`, `butter`, `mint`, `sky`, `lilac`, `rose`).
4. Keep pages calm: a few well-chosen tiles beat many. Ask before deleting things the user added.
5. Edits are version-checked, so an agent and the person in the studio can work at the same time.
6. Layouts: `bento` is the grid, `list` is one column of links, and `canvas` places every tile freely, like a design canvas.
   On `canvas` a tile can carry `pos: { x, y, w, h, r, z }` in a design space **1200 units wide** (the page scales it to fit;
   `y` grows downwards without limit). `r` is rotation in degrees (-15 to 15, default 0) and `z` is the layer (higher on top,
   default 0). Tiles without `pos` are placed automatically, flowing like the grid below any placed tiles, so switching a page
   to canvas needs no positions at all. The auto grid is 4 columns of 288 with 16 gaps: a small tile is 288×288, wide 592×288,
   tall 288×592, large 592×592, and column `n` starts at `x = n × 304`. Keep values on multiples of 8, overlap tiles only on
   purpose, and keep text tiles at least 160 wide. Example: `update_tile` with `{"pos":{"x":608,"y":0,"w":592,"h":288,"r":-3,"z":1}}`.
   On phones (under 600px) a canvas page becomes one column, ordered top to bottom, then left to right.

## Tile types

| type | required fields | notes |
|---|---|---|
| `link` | `url` | optional `title`, `description`, `image` |
| `social` | `platform`, `handle` | platforms are listed in the schema; `email` works too |
| `text` | `text` | supports `**bold**`, `*italic*` and `[links](https://…)`. On the desk layout, `look: "stamp"` turns a short note into a round badge |
| `heading` | `text` | section title, always full width |
| `image` | `src` | uploaded or external image URL |
| `video` | `url` | YouTube. Optional `image` replaces the thumbnail |
| `music` | `url` | Spotify track, album, playlist, artist or show. `title` and cover `image` are filled in automatically |
| `github` | `repo` (`owner/name`) | stars, description and language are filled in automatically |

The JSON Schema for a whole page is in `schema/page.schema.json` (`npm run schema` regenerates it).

## REST and public JSON

```bash
curl -H "Authorization: Bearer posy_..." https://YOUR-POSY/api/v1/page
curl -X POST -H "Authorization: Bearer posy_..." -H "Content-Type: application/json" \
  -d '{"input":"https://github.com/owner/repo"}' https://YOUR-POSY/api/v1/page/tiles
curl -X POST -H "Authorization: Bearer posy_..." https://YOUR-POSY/api/v1/page/publish
curl https://YOUR-POSY/api/v1/public/USERNAME      # anyone can read a published page
```

Each published page also has a plain-text version at `/<username>/llms.txt`.

## The CLI

```bash
export POSY_URL=https://YOUR-POSY POSY_API_KEY=posy_...   # your server, or https://posy.page
npm run posy -- get
npm run posy -- add https://github.com/owner/repo --size w
npm run posy -- add "Open to freelance work" --color mint
npm run posy -- theme --preset midnight --font soft --tiles glass
npm run posy -- profile --bio "Designer and tinkerer"
npm run posy -- remove t-abc1234
npm run posy -- publish
npm run posy -- export my-page.json   # also: import <file>, validate <file>
```
