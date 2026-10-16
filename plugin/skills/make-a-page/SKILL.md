---
name: make-a-page
description: Make or update a Posy link-in-bio page ("Linktree-like", "link in bio", portfolio links page). Use when the user wants a page for their links, or wants to add links, change the look or publish an existing Posy page.
---

# Make a Posy page

Posy turns a list of links into a calm, good-looking page at `posy.page/<username>`. You do it with the `posy` MCP tools; the first call opens a sign-in to the user's Posy account.

1. **Look first.** Call `get_page`. If it returns a page, you are editing; skip to step 4. If it says there is no page, continue.
2. **Interview, briefly.** Ask for: their name, a one-line bio, the username they want (3–30 letters, numbers, `-`, `_`), their links (profiles, projects, videos, email, anything), and the vibe. Call `list_options` and offer 2–3 of the six looks (`styles`: Desk, Washi, Lofi, Painted, Cobalt, Night) in plain words, using each one's note, rather than reading out ids. On posy.page, Desk and Cobalt are free and the others are Pro.
3. **Create.** Call `create_page` with `username`, the chosen `style` (the look) and `empty: true`. If the username is taken, suggest another.
4. **Add links.** Call `add_tile` once with `inputs`: every link in order. Put `{"heading": …}`-style sections in with separate `add_tile` calls using `tile: {"type":"heading","text":"Work"}`. Pass raw URLs, emails or `owner/repo`; Posy picks the right tile.
5. **Profile and theme.** `set_profile` for name and bio, `set_theme` only for what the user asked to change.
6. **Review, then publish.** Call `get_page`, tell the user what is on the page in a sentence, and ask before `publish`. Share the public URL it returns.

Rules: keep it calm, 5–12 links. Use only links the user gave you. Ask before `remove_tile` or `import_page` with `replace: true`.

Without MCP (a chat that cannot connect): write the page as a Posy brief and give the user `https://posy.page/new` to paste it into. Format: https://posy.page/docs/format
