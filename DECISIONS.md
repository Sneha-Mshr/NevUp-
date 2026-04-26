# DECISIONS.md — Architectural Rationale

## Track Selection: System of Engagement (Track 3)

Chose the frontend track because it is the most self-contained deliverable — no external LLM APIs, no message queue infrastructure, and the mock API (Prism) provides a zero-config backend. This lets me focus entirely on interaction quality and engineering depth.

## Next.js 14 with App Router

Selected Next.js 14 (not 15+) for production stability and broad Lighthouse CI compatibility. The App Router provides server components for the layout shell while client components handle interactive features like the debrief flow and heatmap. The `output: "standalone"` config produces a minimal Docker image.

## No Component Library — Custom CSS Modules

The spec explicitly prohibits component libraries. CSS Modules provide scoped styles with zero runtime cost, which directly supports the Lighthouse performance target (≥90). CSS custom properties (variables) create a consistent dark theme without a CSS-in-JS runtime.

## Custom SVG Heatmap (No Library)

Built the behavioral heatmap as a pure SVG component. Each cell is a `<rect>` with computed fill color based on a quality score derived from win rate (40%), plan adherence (40%), and PnL direction (20%). The heatmap supports keyboard navigation (tab + enter) and ARIA labels for accessibility. Tooltip positioning uses fixed coordinates from `getBoundingClientRect` to avoid overflow issues.

## Seed Data as Local JSON

Rather than depending on the Prism mock API for all data (which returns random/example responses), the seed CSV is parsed at build time into a JSON module. This ensures the dashboard shows real, meaningful data from the 388-trade dataset. The API layer (`src/lib/api.ts`) is still wired up for production use — the local data module is the development/demo fallback.

## SSE Coaching with Graceful Degradation

The coaching panel attempts a real EventSource connection first. If no data arrives within 3 seconds (mock API doesn't support SSE), it falls back to a simulated token-by-token stream. On connection drop, it shows a "Reconnecting..." state with exponential backoff (1s, 2s, 4s... up to 30s) — never a blank screen.

## 5-Step Debrief Flow — Keyboard-First Design

Each step has a distinct slide-in animation (`slideIn` keyframe). Focus management moves to the step container on transition via `useRef` + `useEffect`. The entire flow is completable with Tab + Enter. Emotion buttons use `role="radio"` with `aria-checked` for screen reader support.

## JWT Auth with jose Library

Using the `jose` library for HS256 JWT signing/verification. The signing secret from the kick-off packet is embedded for development. Token generation happens client-side for the demo (trader selector → generate token → use for API calls). In production, this would be server-side only.

## Docker Compose — Single Command Startup

`docker compose up` starts both the Prism mock API server and the Next.js production build. The frontend depends on the mock API health check, ensuring the API is ready before the frontend starts accepting requests.
