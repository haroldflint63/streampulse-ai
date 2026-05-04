<div align="center">

# StreamPulse AI

### Netflix-style streaming UI · Real-time viral-moment engine · LLM-powered insights

**[▶ Live demo →](https://streampulse-ai.vercel.app)** &nbsp;·&nbsp;
[Architecture](https://streampulse-ai.vercel.app/architecture) &nbsp;·&nbsp;
[Case study](https://streampulse-ai.vercel.app/case-study)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-5-000?logo=fastify)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-ff3158)
![Recharts](https://img.shields.io/badge/Recharts-2-7C5CFF)
![Groq](https://img.shields.io/badge/Groq-Llama_3.1-00D4A8)
![Vercel](https://img.shields.io/badge/Vercel-Production-000?logo=vercel)

</div>

---

## What is StreamPulse?

A production-shaped, recruiter-grade demo of a **streaming discovery platform** with a
**real-time viral-moment engine** layered on top. Browse a Netflix-style catalog,
play any title from a working CDN-backed `<video>` element, and watch a live
analytics layer (concurrent viewers, watch hours, drop-off alerts, AI insight) update
in the background — same components you'd ship at a streaming platform's engineering
team.

> Open the demo, click **Play** on the hero, and the video starts immediately.
> Click **Recruiter Demo** for a 6-step guided tour of the viral engine, weighted
> scoring formula, and architecture.

---

## Highlights

- 🎬 **Netflix-style homepage** — cinematic hero, three carousel rows ("Trending now"
  numbered, "Continue exploring", "Open-source cinema"), glass analytics strip
  overlapping the hero.
- ▶️ **Working video player** — `<video>` with muted autoplay + a "Tap for sound"
  overlay that satisfies browser autoplay policies. All 6 catalog titles served from
  Blender Foundation, w3.org, and test-videos.co.uk (HTTP 206 verified).
- 📡 **Stream telemetry** — `play / pause / seek / stop / ended` events POST to
  `/api/events` (no-op when backend is offline).
- 🔥 **Viral Moment Engine** — weighted score (0–100) over viewer velocity, chat
  velocity, sentiment, trend match, platform popularity, and a z-score anomaly term.
- 🤖 **AI insights** — `/api/insight` and `/api/explain` proxy strict-JSON Groq
  (Llama 3.1 8B Instant) calls; UI shows a `Groq · live` / `Heuristic` badge so the
  state is never ambiguous.
- 📈 **Live charts** — Recharts area chart of concurrent viewers (last 60s),
  per-card SVG sparklines.
- 🎯 **Alert dispatcher** — animates new drop-off alerts in with idempotency on
  `(streamId, kind)`.
- 🧭 **Architecture page** — full data-flow diagram + service layers + DB schema.
- 📚 **Case study page** — problem, formula, tradeoffs, scaling, future work, resume
  bullets.
- 👋 **Recruiter Demo** — 6-step guided tour with progress dots and an auto-fired
  spike at step 4.
- 🛡️ **Failure-soft** — backend offline → in-browser `LocalSimulator`; Groq timeout
  → heuristic narrative; bad video source → retry overlay. Every state is visible.

---

## Architecture

```
┌─────────────────┐  events  ┌─────────────┐   xadd   ┌──────────────┐
│  Browser / SDK  │─────────▶│ API Gateway │─────────▶│ Redis Streams│
└─────────────────┘          │  Fastify+ws │          │  (ingest log)│
        ▲                    └─────────────┘          └──────────────┘
        │                          │                         │ xreadgroup
        │ ws                       │ ws fan-out              ▼
        │                          ▼                  ┌──────────────┐
        │                   ┌─────────────┐           │   Scoring    │
        │                   │ WS Fan-out  │◀──pub─────│   Worker     │
        │                   └─────────────┘   Redis   └──────────────┘
        │                          ▲          pub/sub        │
        │                          │                         │ score+rank
        │                          │                  ┌──────────────┐
        │                          │                  │ Ranking Store│
        │                          │                  │  ZSET + PG   │
        │                          │                  └──────────────┘
        │                          │
        │                   ┌─────────────┐
        └──── /api/explain ─│ Groq Llama  │  same-origin proxy ·
        └──── /api/insight  │ 3.1 Instant │  key never reaches the browser
                            └─────────────┘
```

**Layer breakdown** (full table at [/architecture](https://streampulse-ai.vercel.app/architecture)):

| Layer            | Tech                                              | Role                                     |
| ---------------- | ------------------------------------------------- | ---------------------------------------- |
| Frontend         | Next.js 15 · React 19 · Tailwind · Framer Motion · Recharts | Catalog, hero, live dashboard, animations |
| API Gateway      | Fastify 5 · Zod · pino · helmet · rate-limit      | HTTP + WS, validation, TLS               |
| Stream Ingestion | Redis Streams (xadd / xreadgroup)                 | Buffered event log, consumer groups      |
| Scoring Worker   | Node worker · weighted blender · EWMA z-score     | Per-second viral score                   |
| Ranking Store    | Postgres + Redis ZSET                             | Hot leaderboard + history                |
| AI Explanation   | Groq Llama 3.1 8B Instant                         | "Why is this trending" narratives        |
| Alert Dispatcher | Redis pub/sub · WS fan-out                        | Real-time breakout alerts                |

---

## AI scoring formula

```
score = 100 · Σ wᵢ · normalize(signalᵢ)

w_viewerVelocity     = 0.22   ← +% viewers in last 10 min  (sigmoid)
w_chatVelocity       = 0.22   ← chat msgs/s vs baseline    (sigmoid)
w_anomalyScore       = 0.20   ← rolling EWMA z-score
w_sentiment          = 0.12   ← chat sentiment NLP (-1..1)
w_trendMatch         = 0.12   ← title/category vs trends
w_platformPopularity = 0.07   ← log10(followers)/5
w_viewersBase        = 0.05   ← log10(viewers)/5
```

Each signal is normalized to `[0,1]` independently before the weighted sum. Viewer
velocity passes through a sigmoid so a +50% jump saturates near 0.95; viewer base is
log-scaled so a 50k stream isn't worth 10x a 5k stream.

[**→ Why these weights & tradeoffs**](https://streampulse-ai.vercel.app/case-study)

---

## System design highlights

- **Latency budget** — event-to-ranked-update p95 ≤ 1.2s · WS fan-out p50 ≤ 50ms.
- **Edge cache + per-IP rate limit** on `/api/explain` (cuts LLM spend ~6× in load tests).
- **Hot/cold tiering** — top ~500 streams scored every 1s; long tail every 10s.
- **Stateless workers** sharded by `hash(streamId)` over Redis consumer groups.
- **Failure-soft** — three independent fallback layers, all documented in source.

---

## Run locally

```bash
git clone https://github.com/haroldflint63/streampulse-ai
cd streampulse-ai
npm install

# .env (see .env.example)
echo 'GROQ_API_KEY=gsk_...' >> .env

npm -w web run dev    # http://localhost:3000
```

`GROQ_API_KEY` is optional — without it `/api/explain` and `/api/insight` return
deterministic heuristic narratives and the UI shows a `Heuristic` badge.

---

## Deploy

The `web` workspace deploys to Vercel as-is (no config). Set `GROQ_API_KEY` in the
project's environment variables for live LLM narratives.

```bash
vercel --prod
```

The optional Fastify backend deploys to Render via the included `render.yaml`.

---

## Folder structure

```
apps/
  web/                    Next.js 15 frontend
    app/
      page.tsx            Netflix-style homepage with live analytics
      architecture/       System-design page
      case-study/         Engineering write-up
      api/
        explain/          Groq proxy for stream narratives
        insight/          Groq proxy for aggregate insights
        events/           Watch-event ingestion endpoint
      watch/[movieId]/    Video player (autoplay + tap-for-sound)
    components/
      Hero.tsx            Cinematic featured-title block
      MovieRow.tsx        Numbered, hover-zoom carousel
      InsightPanel.tsx    Groq narrative card
      AnalyticsLists.tsx  TopList + AlertList
      viral/              Sidebar, StreamCard, Sparkline, RecruiterTour, …
    lib/
      sampleMovies.ts     6 verified-playable titles
      localSim.ts         in-browser metrics + insight simulator
      viralEngine.ts      weighted scoring + anomaly detection
      viralSim.ts         in-browser pipeline simulator
      sampleStreams.ts    seeded fake live streams
  api/                    Fastify backend (optional, deploys to Render)
packages/
  shared/                 Wire-format types shared across runtimes
  events/                 Telemetry event schemas
```

---

## Future roadmap

- 🧠 Real chat-sentiment ONNX model (DistilBERT) running in the worker
- 🪪 Cross-platform creator identity resolution
- ⏪ Replay mode — scrub the last hour of viral moments with the score curve
- 👤 Supabase auth + RLS for user favorites & follows
- 🔔 Service-worker push notifications on viral alerts
- 🧪 A/B tested weight vectors optimizing CTR-to-stream

---

## Resume bullets

- **Built a real-time AI stream-discovery platform** (Next.js 15, React 19,
  TypeScript, Fastify, WebSockets, Redis Streams, Groq Llama 3.1) that serves a
  Netflix-style catalog with a live viral-score overlay updated every second.
- **Designed a weighted-feature scoring engine** (viewer velocity, chat velocity,
  sentiment, trend match, EWMA z-score anomaly) with per-signal normalization;
  shipped a same-origin `/api/explain` Groq proxy generating 1-sentence narratives
  at ~700ms p95 with edge cache + per-IP rate limiting.
- **Engineered a failure-soft dual-mode runtime**: when the backend is offline, the
  frontend falls back to a deterministic in-browser `LocalSimulator` driving the
  same UI components — the dashboard is never empty, even during cold starts.
- **Built a recruiter-grade UI**: glass-morphism panels, cinematic hero, hover-zoom
  carousels, autoplay-safe video player with a "Tap for sound" overlay, animated
  drop-off alert feed (Framer Motion), Recharts velocity chart, and a 6-step guided
  "Recruiter Demo" tour explaining the architecture in under 60 seconds.

---

<div align="center">

Built by **Harold Flint** · MIT Licensed

</div>
