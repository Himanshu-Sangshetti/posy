# Self-hosting Posy

Posy runs as one Node app with a SQLite (or Turso) database and a place for uploads. Everything is
unlocked on a self-hosted instance. The first account you create owns it, and `/` is that account's page.

If you would rather not run a server, [posy.page](https://posy.page) hosts the same app. Pages move both
ways with Settings, Download page.json and Import page.json.

## Docker

```bash
docker build -t posy .
docker run -d --name posy -p 3000:3000 -v posy-data:/data \
  -e NEXT_PUBLIC_SITE_URL=https://links.example.com \
  -e BETTER_AUTH_URL=https://links.example.com \
  -e BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
  --restart unless-stopped posy
```

Use `http://localhost:3000` for both URLs while trying it out. Open the URL and sign up.

## Docker Compose

Edit `docker-compose.yml`: set the two URLs and a long random `BETTER_AUTH_SECRET`
(`openssl rand -base64 32`), then:

```bash
docker compose up -d
```

## Vercel (Turso + Blob)

Vercel has no persistent disk, so use a hosted database and file store.

1. Create a database at [turso.tech](https://turso.tech). Note its URL (`libsql://...`) and create an auth token.
2. Press the Deploy button in the README, or import the repo in Vercel.
3. In the project, add a Blob store (Storage tab, Blob). That creates `BLOB_READ_WRITE_TOKEN`.
4. Set the environment variables below: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET`,
   `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` (both your final URL, for example `https://links.example.com`).
5. Deploy, open the URL and sign up. Migrations run on start.

## Any Node host

```bash
npm ci
npm run build
NEXT_PUBLIC_SITE_URL=https://links.example.com BETTER_AUTH_URL=https://links.example.com \
BETTER_AUTH_SECRET=... POSY_DATA_DIR=/var/lib/posy npm start
```

Node 20.9 or newer. Set `NEXT_PUBLIC_SITE_URL` before `npm run build`, since it is baked into the build.

## Environment

Posy checks its environment when the server starts. In production it refuses to boot, and tells you what to fix,
if a required variable is missing, if `BETTER_AUTH_SECRET` is shorter than 32 characters, the built-in development
secret or the placeholder from `docker-compose.yml` (`change-me-to-a-long-random-string`), or if the two URLs
disagree. In development everything has a default. `.env.example` has every variable with comments.

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | **Required in production.** Public URL, used for share links and images. Set before `npm run build`. |
| `BETTER_AUTH_URL` | | **Required in production.** Same scheme and host as `NEXT_PUBLIC_SITE_URL`. |
| `BETTER_AUTH_SECRET` | | **Required in production.** 32+ characters: `openssl rand -base64 32`. |
| `POSY_SIGNUP` | `first-user` | `open`, `closed` or `first-user`. |
| `POSY_DATA_DIR` | `.data` (`/data` in Docker) | SQLite file and uploads. |
| `DATABASE_URL` | local file | Turso / libSQL URL. **Required on Vercel.** |
| `DATABASE_AUTH_TOKEN` | | Required with a remote `DATABASE_URL`. |
| `BLOB_READ_WRITE_TOKEN` | | Vercel Blob for uploads (needed on Vercel). |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | | GitHub sign-in (set both). |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | | Google sign-in (set both). |
| `GITHUB_TOKEN` | | Higher API limit for repo tiles. |
| `POSY_TELEMETRY` | on in production | Set `0` to turn off anonymous usage stats. `DO_NOT_TRACK=1` works too. See [telemetry](telemetry.md). |
| `POSY_TELEMETRY_KEY`, `POSY_TELEMETRY_HOST` | Posy's PostHog | Only for forks that want their own PostHog project. |
| `POSY_URL`, `POSY_API_KEY` | | Used by `npm run posy` and agents, not by the server. |

## Your own domain

There is nothing to enable in Posy. Point your domain's DNS at your server (or at Vercel, after adding the
domain to the project), make sure it serves HTTPS, and set `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL`
to that address. Your page is the home page of the domain.

On a plain server, put a reverse proxy in front for HTTPS. With Caddy that is two lines:

```
links.example.com {
  reverse_proxy localhost:3000
}
```

## Backups

Everything lives in the data directory (`/data` in Docker): `posy.db` and your uploads. Copy that
folder and you have a backup.

```bash
docker run --rm -v posy-data:/data -v "$PWD":/backup alpine tar czf /backup/posy-data.tgz -C /data .
```

On Turso, use its own backups, and your uploads are in Vercel Blob. A lighter backup of just your
page: Settings, Download page.json (or `npm run posy -- export page.json`).

## Upgrading

```bash
git pull
docker compose build && docker compose up -d
```

Migrations run when the app starts. Back up the data directory first. On Vercel, pull the new code and redeploy.
