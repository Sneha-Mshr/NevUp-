# NevUp — System of Engagement (Track 3)

Deplyoed Link On Netify - https://legendary-cucurucho-0e0cfb.netlify.app/
( Deplyoed on Netify and Vercel both )

Post-session debrief and behavioral dashboard for the NevUp AI Trading Coach platform.

## Quick Start

### Docker (recommended)
```bash
docker compose up
```

### Local Development
```bash
# Generate seed data
node scripts/build-seed.js

# Install and run
npm install
npm run dev
```

### With Mock API (Prism)
```bash
npx @stoplight/prism-cli mock data/nevup_openapi.yaml --port 4010
```

## Features

### Post-Session Debrief Flow (5 steps)
1. **Trade Replay** — Review all trades with P&L, direction, rationale
2. **Emotional Tagging** — Tag each trade with emotional state
3. **Plan Adherence** — Rate 1-5 how well you followed your plan
4. **AI Coaching** — Live SSE-streamed coaching message
5. **Key Takeaway** — Save your main insight

### Behavioral Heatmap
Custom SVG heatmap (no library) showing daily trade quality across a rolling window. Hover for session summary, click to navigate to debrief.

### Real-Time Coaching Panel
SSE streaming with exponential backoff reconnection. Graceful degradation on connection drop.

## Component States

### Loading State
Every data-fetching component shows an animated skeleton loader.

### Error State
Shows error message with a "Try again" retry button.

### Empty State
Shows a helpful prompt when no data is available.

## Lighthouse CI
```bash
npm run build
npx lhci autorun
```

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- CSS Modules (no component library)
- Recharts (for charts, not heatmap)
- jose (JWT)

## Seed Data
Place `nevup_seed_dataset.csv` in `data/` and run:
```bash
node scripts/build-seed.js
```
