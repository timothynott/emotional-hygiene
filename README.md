# Emotional Hygiene

A personal mood and capacity tracking instrument. Guiding philosophy: **dumb but persistent** — the app captures data faithfully and is reliably present. It does not interpret, advise, or nudge beyond what's explicitly justified.

## What it tracks

A 0–6 capacity scale where anchors describe **observable capacity** (what you can do), not feeling words — so the score stays answerable on a bad morning or while triggered.

Three daily check-ins plus an on-demand reset ritual:

- **Morning — Activation.** Score + one forward-pointing first action.
- **Midday — Scan.** A check for whether a trigger occurred. Expands into reset fields if score ≤ 2.
- **Evening — Reflection.** How the day went + tomorrow's first action.
- **Reset — any time.** What happened / body sensation / one reframe or next step.

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| UI | React + Vite, TypeScript | PWA, installable on mobile |
| Storage | `localStorage` | No backend — all data stays on device |
| Hosting | Cloudflare Pages | Branch preview deploys included |

**To deploy this yourself you'll need a Cloudflare account.** The deployment guide is at [docs/deployment.md](docs/deployment.md). If you want to host elsewhere (Vercel, Netlify, GitHub Pages, self-hosted), the app is a standard static Vite build — a PR adding an alternative deploy path is welcome.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. On the same local network, your phone can reach the dev server at `http://<your-laptop-ip>:5173`.

## Build

```bash
pnpm build
pnpm preview   # serve the production build locally
```

## Docs

See [docs/](docs/index.md) for the glossary and deployment guide.

## Tests

Domain logic is covered by a pure Node.js test suite (no framework required):

```bash
pnpm test
```
