# AGENTS.md

Guide for AI coding agents (and people) working in this repo. For the product, read [README.md](README.md).
For adding a look in detail, read [CONTRIBUTING.md](CONTRIBUTING.md).

## What Posy is

A link-in-bio page you own. Six looks (Desk, Washi, Lofi, Painted, Cobalt, Night), an editor, a REST API, a hosted MCP server and a CLI.
One app, two ways to run it: self-hosted (everything unlocked) or posy.page (free and Pro plans).
A page is one JSON file described by `src/lib/schema.ts`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Motion · dnd-kit · shadcn/ui (Radix) · Zustand ·
Better Auth · Drizzle ORM + libSQL (SQLite file, or Turso) · Zod · MCP (`mcp-handler`) · Vitest · Playwright.
Node 22 or newer. npm only (keep `package-lock.json` in sync).

## Commands

```bash
npm install
npm run dev          # http://localhost:3000; data lives in ~/.posy (set POSY_DATA_DIR to move it)
npm run check        # tsc --noEmit + validate the example pages
npm test             # unit tests (Vitest), tests/unit
npm run e2e          # Playwright, tests/e2e; builds and starts its own server on port 3211
npm run build        # production build
npm run schema       # regenerate schema/page.schema.json after changing src/lib/schema.ts
npm run posy -- --help   # the CLI
```

Before you finish a change, run `npx tsc --noEmit -p .` and `npx vitest run`. Run `npm run e2e` if you touched the app, API or MCP
(stop `npm run dev` first; one Next server per folder).

## Structure

| Path | What |
|---|---|
| `src/lib/schema.ts` | The page format (Zod). Source of truth for the JSON Schema, the API and the MCP tools. |
| `src/lib/styles.ts`, `style.ts`, `themes.ts`, `fonts.ts`, `templates.ts` | Looks, palettes, fonts and starter pages |
| `src/lib/detect.ts`, `platforms.ts`, `enrich.ts` | Turn a pasted link into a tile |
| `src/components/page/` | The public page. Server components with small client islands. `styles/<look>.tsx` + `.css` per look. |
| `src/components/studio/` | The editor (Zustand store, dnd-kit) |
| `src/components/ui/` | shadcn/ui primitives |
| `src/app/` | Routes. `api/v1` is REST, `api/mcp` is MCP, `lab/` is the component lab for looks. |
| `src/edition/` | What an instance allows (self-hosted vs posy.page) |
| `src/db/`, `drizzle/` | Database schema and migrations |
| `public/looks/<id>/` | Art for each look. Every file is listed in `public/looks/CREDITS.md`. |
| `schema/`, `docs/`, `examples/` | JSON Schema, Markdown docs, example pages |
| `plugin/`, `server.json` | Claude Code / Cursor plugin and the MCP registry entry |
| `scripts/` | The CLI (`posy.ts`) and `page-shot.mjs` for screenshots |
| `tests/` | `unit/` and `e2e/` |

## Conventions

- Write short, plain sentences in docs, UI text and comments. No marketing words.
- TypeScript strict. No `any` unless you explain why. Validate input at the edge with Zod.
- Server components by default. Add `'use client'` only for state, effects or browser APIs.
- Styles: Tailwind for app UI. Each look keeps its own CSS file next to its component.
- Design: pastel and calm. No hard borders, loud gradients or badges. Motion is soft and respects `prefers-reduced-motion`.
- Check every visual change in a light and a dark palette, on desktop and on a phone.
- Keep the page format, REST API, MCP tools, CLI and docs in step. If you change one, check the others.
- Small pull requests. One idea each. Update `CHANGELOG.md` under "Unreleased" for anything a user would notice.

## How to add a look

Follow the 11 steps in [CONTRIBUTING.md](CONTRIBUTING.md#adding-a-look). In short:

1. Add the id to `STYLES` in `src/lib/schema.ts`, then register it in `styles.ts`, `style.ts`, `themes.ts`, `fonts.ts` and `templates.ts`.
2. Build `src/components/page/styles/<id>.tsx` and `.css` (`Header`, `Tile`, `Row`), and register them in `styles/index.tsx`.
3. Add art to `public/looks/<id>/` and list every file in `public/looks/CREDITS.md` (public domain, CC0 or your own only).
4. Add a lab page under `src/app/lab/` and check it at `/lab/page/<id>?set=rich|sparse|photos|starter` in every palette.
5. Add tests: `tests/unit/templates.test.ts` and, for schema changes, `tests/unit/schema.test.ts`. Run `npm run schema`.

## Tests to run

| You changed | Run |
|---|---|
| Anything | `npx tsc --noEmit -p .` and `npx vitest run` |
| Schema, templates, link detection | The matching file in `tests/unit/`, then `npm run schema` |
| Routes, auth, API, MCP, the editor flow | `npm run e2e` |
| A look | The lab pages, and `node scripts/page-shot.mjs <id> <set>` (needs `npx next dev -p 3200`) |

## Do not

- Do not commit secrets, `.env*` files, databases or `.data/`. Only `.env.example` is tracked.
- Do not commit private notes or planning files (`PLAN.md`, `CLAUDE.md`, `notes/`, `.scratch/`). They are gitignored.
- Do not add art you do not have the right to ship. Do not remove entries from `public/looks/CREDITS.md`.
- Do not add a runtime dependency without a clear reason. Posy is small on purpose.
- Do not make network calls from tests, and do not point tests at real data. E2E uses a throwaway database in `.scratch/e2e-data`.
- Do not fetch user-supplied URLs without the existing safety checks (see `src/app/api/unfurl`).
- Do not hand-edit generated files: `schema/page.schema.json`, `public/schema/page.schema.json`, `drizzle/meta/*`. Regenerate them.
- Do not run `git push` or open releases unless the owner asked you to.
