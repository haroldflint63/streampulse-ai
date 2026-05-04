# StreamPulse AI

> Production-grade event-driven streaming observability platform — Fastify + Next.js + Redis Streams + Cohere + Groq.

**Live demo:** _populated after first Vercel deploy_

StreamPulse AI ingests a high-frequency stream of `play / pause / seek / progress / stop` events from a video player, aggregates them in 5s and 60s rolling windows, broadcasts deltas to every connected dashboard over WebSockets, detects audience drop-off in real time, and asks an LLM for a short natural-language read on what's happening — falling back to deterministic rules whenever the model is unavailable.

The repo is a pnpm-style npm workspace monorepo.

## Architecture

```
                 ┌───────────────────────┐
 video player ──►│  POST /watch-event(s) │──┐
                 └───────────────────────┘  │
                                            ▼
                              ┌───────────────────────────┐
   simulator ────────────────►│   EventBus (Redis Streams │
   (server-side, optional)    │    or in-memory fallback) │
                              └───────────────────────────┘
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │  Aggregator (60s active   │
                              │  users, 5s EPS, drop-off  │
                              │  detection, top movies)   │
                              └───────────────────────────┘
                                  │            │
                                  ▼            ▼
                          ┌──────────────┐  ┌───────────────────┐
                          │ Supabase     │  │ Groq insight call │
                          │ (audit log)  │  │  (12s cadence)    │
                          └──────────────┘  └───────────────────┘
                                  │            │
                                  └────┬───────┘
                                       ▼
                              ┌───────────────────────────┐
                              │  WS gateway → dashboards  │
                              └───────────────────────────┘
```

## Tech stack

- **Backend:** Fastify 5, native `ws`, ioredis (Redis Streams), Supabase (optional audit log), Cohere v2 embeddings, Groq Llama-3.1 chat completions, TMDB enrichment.
- **Frontend:** Next.js 15 (App Router, RSC) + React 19 + Tailwind 3.
- **Resilience:** every external call is wrapped in a circuit breaker with exponential-backoff retry; AI features fail soft to deterministic fallbacks; bus falls back from Redis to in-memory.
- **Demo mode:** built-in server-side simulator (`DEMO_MODE=true`) plus a fully in-browser simulator so the Vercel-only deploy still demos with no backend.

## Quick start

```bash
git clone https://github.com/haroldflint63/streampulse-ai.git
cd streampulse-ai
cp .env.example .env
npm install
npm run dev          # api on :8080, web on :3000
```

Open http://localhost:3000.

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `PORT`, `HOST` | no | Defaults `8080` / `0.0.0.0` |
| `WEB_ORIGIN` | no | CORS allowlist for the dashboard |
| `REDIS_URL` | no | Falls back to in-memory bus |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | no | Disables audit log when missing |
| `COHERE_API_KEY` | no | Falls back to deterministic pseudo-embeddings |
| `GROQ_API_KEY`, `GROQ_MODEL` | no | Falls back to rule-based insights |
| `TMDB_API_KEY` | no | Catalog still served from bundled public-domain titles |
| `DEMO_MODE`, `DEMO_USERS`, `DEMO_EVENT_RATE_HZ` | no | Server-side simulator |
| `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_WS_URL` | web only | When unset, web runs an in-browser simulator |

## Deploy

- **Frontend (Vercel):** `cd apps/web && vercel --prod`. With `NEXT_PUBLIC_WS_URL` empty, the dashboard runs entirely in-browser and is fully demo-able with zero backend.
- **Backend (Render):** `render.yaml` at repo root provisions a free web service that runs `npm run start:api`.

## Failure-mode design

| Provider | Failure behavior |
|----------|------------------|
| Redis | Falls back to `MemoryBus`, no data loss for in-process subscribers |
| Cohere | Switches to deterministic 64-dim hash embedding; recommendations remain stable |
| Groq | Rule-based summary for drop-off / heavy traffic / steady |
| Supabase | Skipped; in-memory aggregation is the source of truth for the dashboard |
| TMDB | Bundled 12-title public-domain catalog still served |

## License

MIT.
