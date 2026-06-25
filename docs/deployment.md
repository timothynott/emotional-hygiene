# Deployment

The app deploys to Cloudflare Pages. Every push to `main` goes to production; every other branch gets an isolated preview URL automatically.

## First-time setup

**1. Create the Pages project**

```bash
npx wrangler pages project create <your-project-name> --production-branch main
```

**2. Build and deploy**

```bash
pnpm build
npx wrangler pages deploy dist --project-name <your-project-name>
```

The deploy command prints a hash-prefixed preview URL (e.g. `abc123.<your-project-name>.pages.dev`). TLS provisioning for that subdomain can take a minute or two on first deploy — use the root production URL (`<your-project-name>.pages.dev`) to verify immediately.

**3. Grant Cloudflare access to your repo (GitHub)**

By default the Cloudflare Pages GitHub app only has access to the repos you explicitly allow. On GitHub: click your **profile avatar → Settings → Integrations → Applications → Installed GitHub Apps → Cloudflare Pages → Configure** → add your repo under **Repository access**.

**4. Connect GitHub (Cloudflare dashboard — one time)**

In the Cloudflare dashboard, navigate to **Compute** in the left sidebar → open your Pages project → **Git integration** → select your repo. After connecting, Cloudflare builds and deploys automatically on every push. Branch preview URLs are enabled by default.

## Build settings

| Setting | Value |
|---|---|
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node version | 20+ |

## GitHub Actions

A `ci.yml` workflow runs `pnpm test` on every push as a quality gate. Cloudflare handles the actual build and deploy independently.

## Ongoing deploys

After initial setup, no manual steps are needed:

- Push to `main` → production
- Push to any branch → preview URL (`branch-name.<your-project-name>.pages.dev`)
- Delete a branch → Cloudflare retains the last deploy for that branch (no cleanup needed)
