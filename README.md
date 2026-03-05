# Idea2Appstore Landing Page

Single-page, iOS-style marketing site for `idea2appstore.com`.

## Files

- `index.html` - full landing page
- `Dockerfile` - static hosting image for Railway (nginx)
- `index.html` includes:
  - Primary mailto CTA button
  - Portfolio cards for Restaurant Club, Noizzle, and Hyrdate Gate
  - Quick Inquiry form that drafts an email to `brendanpinder0@gmail.com`

## Local Preview

From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

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
3. Railway will detect the root `Dockerfile` and build from it.
4. In your service settings, use Networking -> Public Networking:
   - Generate a Railway domain first (for testing)
   - Add your custom domain (`idea2appstore.com`)
5. Railway will give you a target value like `xxxx.up.railway.app` for DNS.

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
