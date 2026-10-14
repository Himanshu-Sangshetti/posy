# Editing Posy with an AI agent

Every Posy account has an API key page (**Agents** in the dashboard), a hosted MCP server, a REST API
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

## MCP tools

| tool | what it does |
|---|---|
| `get_page` | Draft (profile, theme, tiles with ids), public URL, version, unpublished-changes flag |
| `add_tile` | Add from a link, email, `owner/repo` or note (auto-detected), or a full tile object |
| `update_tile` / `remove_tile` / `move_tile` | Change fields, delete, reorder by id |
| `set_theme` | Preset, accent, font, radius, layout (`desk`, `bento`, `list`), alignment, background, tile style, hover effect, avatar |
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
export POSY_URL=https://YOUR-POSY POSY_API_KEY=posy_...
npm run posy -- get
npm run posy -- add https://github.com/owner/repo --size w
npm run posy -- add "Open to freelance work" --color mint
npm run posy -- theme --preset midnight --font soft --tiles glass
npm run posy -- profile --bio "Designer and tinkerer"
npm run posy -- remove t-abc1234
npm run posy -- publish
npm run posy -- export my-page.json   # also: import <file>, validate <file>
```
