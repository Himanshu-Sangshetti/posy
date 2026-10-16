# Posy docs (Mintlify)

Public docs for https://docs.posy.page. `docs.json` is the Mintlify config; pages are `.mdx`.

## Where content comes from

| Page | Source |
|---|---|
| `agents/connect`, `agents/format`, `agents/guide`, `self-host/guide` | `docs/connect.md`, `docs/format.md`, `docs/ai-agents.md`, `docs/self-hosting.md` (also served by the app at `/docs/<slug>` and `/llms-full.txt`) |
| `contribute/guide`, `changelog` | `CONTRIBUTING.md`, `CHANGELOG.md` |
| `api-reference/openapi.json` | the app's `/openapi.json` route |
| everything else (`index`, `quickstart`, `first-page`, `looks`, `agents/tools`, `agents/llms-txt`, `self-host/environment`, `self-host/telemetry`, `contribute/community`, `api-reference/introduction`) | written by hand here |

The generated files are committed (Mintlify builds from the repo). **Edit the source, never the generated file**, then run:

```bash
npm run docs:sync
```

It adds frontmatter, rewrites links (`/docs/format` -> `/agents/format`, `/new` -> `https://posy.page/new`), escapes MDX, refreshes the OpenAPI copy (dev server on :3200, else posy.page; set `POSY_OPENAPI_URL` to override) and fails if an MCP tool in `src/app/api/mcp/route.ts` is missing from `agents/tools.mdx`.

## Run locally

Mintlify needs an LTS Node (20, 22 or 24; it refuses Node 25).

```bash
npm run docs:dev                 # sync, then http://localhost:3333
cd docs-site && npx mint@latest broken-links
cd docs-site && npx mint@latest validate
```

## Deploy

1. Create a Mintlify account at https://mintlify.com and install the Mintlify GitHub app on the Posy repo.
2. In the dashboard, set the docs directory to `docs-site` and the branch to `main`.
3. Add the custom domain `docs.posy.page`. Mintlify shows the CNAME target; create `docs CNAME <target>` at your DNS provider.
4. Every push to `main` redeploys. Run `npm run docs:sync` before committing.
