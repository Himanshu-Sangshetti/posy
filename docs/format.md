# The Posy page file

A Posy page can be one small JSON file. Any chat (ChatGPT, Claude, Gemini, a local model) can write it, and anyone can load it
at [`/new`](/new), in the editor (Import), or through the API. No connector or account is needed to preview it.

## The easy way

1. Open [`/new`](/new) and press **Copy a prompt for your chat**.
2. Paste the prompt into your chat and answer its questions (name, bio, links, vibe).
3. Paste the JSON it returns back into the box on `/new`. Check the preview, then **Make it mine**.

## The brief

```json
{
  "posy": 1,
  "username": "mira",
  "name": "Mira Sol",
  "bio": "Illustrator making small, soft things",
  "location": "Lisbon",
  "look": "minimal",
  "theme": "paper",
  "links": [
    { "heading": "Find me" },
    "https://github.com/mira",
    "hi@mira.so",
    { "heading": "Work" },
    { "url": "https://mira.so/portfolio", "title": "Portfolio", "size": "w" },
    "mira/atlas",
    { "text": "Open for commissions" }
  ]
}
```

| field | meaning |
|---|---|
| `name` | Required. Display name. |
| `links` | Required. In order. A string is a URL, an email, `owner/repo` or a short note: Posy picks the right tile (GitHub repo, YouTube, Spotify, social profile, link). |
| `username` | Optional. The address, `/<username>`. 3–30 letters, numbers, `-` or `_`. You can choose it when you load the file. |
| `bio`, `location`, `avatar` | Optional. `avatar` is an image URL. |
| `look` | Optional. The look of the page. The current options are listed in `/schema/brief.schema.json` and in the copied prompt. |
| `theme` | Optional. Colours. Same: see the schema. |
| `layout` | Optional. `bento`, `list` or `canvas`. |

A link can also be an object: `{"heading": "…"}` starts a section, `{"text": "…"}` is a note, and `{"url": "…", "title": "…", "description": "…", "size": "w", "color": "…"}` overrides how one tile looks. Give each object exactly one of `url`, `email`, `repo`, `heading` or `text`. `size` is `s` (small), `w` (wide), `t` (tall) or `l` (large).

Posy is forgiving. It accepts the JSON wrapped in prose or a code fence, smart quotes and trailing commas. Unknown fields and small mistakes become
warnings, not errors. If something is really wrong, the message says what to ask your chat to fix.

## The full page file

The JSON that Posy exports (Settings → Export) works too: it is the complete page (profile, theme, every tile with its id, size and position).
Its format is [`/schema/page.schema.json`](/schema/page.schema.json). Use the brief when a chat writes the page, and the full file to move a page between Posy sites.

## For agents and scripts

- Schema: [`/schema/brief.schema.json`](/schema/brief.schema.json)
- REST: `POST /api/v1/page/import` with `{ "file": <brief or text>, "username": "mira", "replace": false }`. Creates the page, or with `replace: true` overwrites the draft.
- MCP: the `import_page` tool takes the same arguments.
- A link that opens a ready-made preview: `/new#p=<base64url of the brief>`. Handing a user this link means they never need to copy anything.
