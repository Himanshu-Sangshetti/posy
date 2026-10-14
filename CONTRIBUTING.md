# Contributing to Posy

Thanks for helping. Posy is small on purpose: a beautiful page, a calm editor, one JSON file.
Before adding a feature, ask whether it makes the page more beautiful or the editor simpler.

## Setup

```bash
npm install
npm run dev          # page at http://localhost:3000, studio at /edit
```

## Before you open a PR

```bash
npm run check        # validates content/page.json + TypeScript
npm test             # unit tests (Vitest)
npm run e2e          # studio click-through tests (Playwright)
npm run build        # static export to out/
```

The end-to-end tests edit a throwaway copy of the page, never `content/page.json`.

## Where things live

| Path | What |
|---|---|
| `src/lib/schema.ts` | The page format (Zod). Run `npm run schema` after changing it. |
| `src/lib/themes.ts` | Theme tokens. Every theme defines the same six pastel tints. |
| `src/lib/platforms.ts` | Social platforms and their icons (Simple Icons). |
| `src/lib/detect.ts` | Turns a pasted link into the right tile. |
| `src/components/page/` | The public page. Server components plus small client islands. |
| `src/components/studio/` | The editor (Zustand store, dnd-kit, shadcn/ui). |
| `src/app/api/*/route.dev.ts` | Local-only APIs, never included in a production build. |

## Adding a platform or a tile type

- **Platform:** add it to `PLATFORMS` with its icon, hosts and URL pattern, then add a case to `tests/unit/detect.test.ts`.
- **Tile type:** add a schema entry, a view in `tiles.tsx`, fields in `TileControls.tsx`, then run `npm run schema`.

## Design guidelines

- Pastel and calm. No hard borders, no loud gradients, no badges or pills.
- Motion is soft and fast; everything respects `prefers-reduced-motion`.
- Check every change in a light and a dark theme, on desktop and on a phone.
