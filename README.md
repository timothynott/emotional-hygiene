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

- React + Vite (PWA), TypeScript
- localStorage for persistence
- Deployed via Cloudflare Pages

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

## Deploy

The `main` branch auto-deploys to Cloudflare Pages. Build command: `pnpm build`. Output directory: `dist`.

## Tests

Domain logic is covered by a pure Node.js test suite (no framework required):

```bash
pnpm test
```
