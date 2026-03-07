# Idea2Appstore Landing Page

Landing pages + beer tracker for `idea2appstore.com`.

## Files

- `index.html` - main landing page
- `draft/index.html` - secondary draft landing page at `/draft`
- `austinbeertracker2026roadto1500.html` - tracker page at `/austinbeertracker2026roadto1500`
- `austinbeertracker2026roadto1500_current_count.html` - updater page at `/austinbeertracker2026roadto1500/current_count`
- `beer_stats.json` - fallback stats source
- `server.js` - Node server that serves static pages + tracker API
- `Dockerfile` - Railway container build

## Local Preview

From this folder:

```bash
npm install
npm start
```

Then open `http://localhost:8080`.

## Beer Tracker API

- `GET /api/beer-stats` returns `current_count`, `average_per_day`, `projected_total`, `goal`, and `days_into_year`.
- `POST /api/beer-stats/current-count` updates `current_count`.

JSON body for updates:

```json
{
  "current_count": 401
}
```

Optional security:

- Set `BEER_TRACKER_ADMIN_KEY` and include it as `x-admin-key` header on update requests.

Optional persistent storage:

- If `DATABASE_URL` is set (Railway Postgres), updates are stored in Postgres.
- If `DATABASE_URL` is not set, updates are written to `beer_stats.json`.

## GitHub Push (for Railway)

This folder is already initialized as its own git repo with an initial commit.

If your GitHub auth needs refresh:

```bash
gh auth login -h github.com
```

Create and push a new repo with CLI:

```bash
gh repo create idea2appstore --public --source=. --remote=origin --push
```

Or create an empty repo on GitHub web, then run:

```bash
git remote add origin https://github.com/<your-user>/idea2appstore.git
git push -u origin main
```

## Deploy on Railway

1. Push this folder to GitHub.
2. In Railway, create a new project and connect that repo.
3. Railway will build from the root `Dockerfile`.
4. In your service settings, use Networking -> Public Networking:
   - Generate a Railway domain first (for testing)
   - Add your custom domain (`idea2appstore.com`)
5. Railway will give you a target value like `xxxx.up.railway.app` for DNS.

## Railway Variables

- `DATABASE_URL` (recommended): add Railway Postgres and reference this variable.
- `BEER_TRACKER_ADMIN_KEY` (recommended): protects count updates.

## Namecheap DNS (BasicDNS)

In Namecheap -> Domain -> Advanced DNS:

1. Add an `ALIAS` record:
   - Host: `@`
   - Value: `<your-railway-target>.up.railway.app`
2. Add a `CNAME` record:
   - Host: `www`
   - Value: `@` (or the same Railway target)

Remove conflicting `A/CNAME/URL Redirect` records on the same host if needed.

## Optional: Vercel Instead

For a static site like this, Vercel is also a strong option:

- Apex `@` -> `A` record `76.76.21.21`
- `www` -> `CNAME` `cname.vercel-dns-0.com`

Or use the DNS values Vercel shows for your specific project.
