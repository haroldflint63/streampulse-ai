import type { ReactNode } from 'react';
import Link from 'next/link';
import { Sidebar } from '../../components/viral/Sidebar';

export const metadata = {
  title: 'Architecture · StreamPulse',
  description: 'System design, data flow, and scaling notes for StreamPulse AI.',
};

const LAYERS: { name: string; tech: string; role: string; tone: string }[] = [
  {
    name: 'Frontend',
    tech: 'Next.js 15 · App Router · Framer Motion · Recharts',
    role: 'Renders the live dashboard, animates score changes, fetches AI explanations on demand.',
    tone: 'from-accent/20 to-accent/5 border-accent/30',
  },
  {
    name: 'API Gateway',
    tech: 'Fastify 5 · Zod · Pino · helmet · rate-limit',
    role: 'HTTP endpoints + WebSocket fan-out. Validates payloads, enforces per-IP rate limits, terminates TLS.',
    tone: 'from-accent2/20 to-accent2/5 border-accent2/30',
  },
  {
    name: 'Stream Ingestion',
    tech: 'Redis Streams (XADD / XREADGROUP) · idempotency keys',
    role: 'Buffers raw signal events from clients & platform webhooks. Consumer-group semantics for scoring workers.',
    tone: 'from-warn/15 to-warn/5 border-warn/30',
  },
  {
    name: 'Viral Scoring Worker',
    tech: 'Node worker · weighted feature blender · z-score anomaly',
    role: 'Pulls events, updates per-stream signal vectors, recomputes viral score every second, writes to ranking store.',
    tone: 'from-accent2/20 to-accent/10 border-accent2/30',
  },
  {
    name: 'Ranking Store',
    tech: 'Postgres (history) + Redis ZSET (hot ranking)',
    role: 'O(log N) leaderboard reads (ZREVRANGEBYSCORE). Postgres holds rolling time-series for charts + retros.',
    tone: 'from-good/15 to-good/5 border-good/30',
  },
  {
    name: 'AI Explanation Service',
    tech: 'Groq (Llama 3.1 8B Instant) · server-side proxy · response_format=json_object',
    role: 'Generates the "why this is trending" narrative. Same-origin Next.js route — API key never reaches the browser.',
    tone: 'from-accent/15 to-accent2/10 border-accent/30',
  },
  {
    name: 'Alert Dispatcher',
    tech: 'Redis pub/sub · WebSocket fan-out · idempotent on (streamId, kind)',
    role: 'When viral score crosses 80, broadcasts to subscribed dashboards. < 50ms median end-to-end.',
    tone: 'from-bad/15 to-accent/5 border-bad/30',
  },
  {
    name: 'Notification Layer',
    tech: 'Browser SSE → service workers → push (planned) · slack/discord webhooks',
    role: 'User-facing delivery of breakout alerts. Throttled per user; per-channel mute settings.',
    tone: 'from-good/15 to-accent2/10 border-good/30',
  },
];

export default function ArchitecturePage() {
  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1100px] px-6 py-12 lg:px-10">
          <Link href="/" className="text-xs font-semibold text-accent2 hover:underline">
            ← Back to live pulse
          </Link>
          <h1 className="mt-4 text-4xl font-black tracking-tight">System architecture</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink2">
            How StreamPulse turns a firehose of viewer events into ranked, AI-explained
            viral moments — with sub-second updates and a simulator-first failure mode.
          </p>

          <DataFlow />

          <h2 className="mt-12 text-sm font-bold uppercase tracking-[0.18em] text-ink3">
            Service layers
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {LAYERS.map((l, i) => (
              <Card key={l.name} tone={l.tone} index={i + 1}>
                <div className="text-sm font-bold text-ink">{l.name}</div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-ink3">
                  {l.tech}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink2">{l.role}</p>
              </Card>
            ))}
          </div>

          <Section title="Latency budget">
            <ul className="grid gap-2 text-sm text-ink/90 sm:grid-cols-2">
              <Bullet k="Event ingest → ranked update" v="≤ 1.2s p95" />
              <Bullet k="WebSocket alert fan-out" v="≤ 50ms median" />
              <Bullet k="AI explanation (Groq)" v="500–1100ms" />
              <Bullet k="Cold start → first paint" v="≤ 1.5s on 4G" />
            </ul>
          </Section>

          <Section title="Caching & rate limiting">
            <ul className="space-y-2 text-sm text-ink/90">
              <li>
                <span className="font-semibold text-ink">Edge cache</span> on{' '}
                <code className="rounded bg-panel/70 px-1 py-0.5 text-xs">/api/insight</code> with
                a 10s SWR window — cuts Groq spend ~6x in load tests.
              </li>
              <li>
                <span className="font-semibold text-ink">Per-IP rate limit</span>: 60 req/min on
                ingest, 20 req/min on AI routes (Fastify rate-limit, sliding window).
              </li>
              <li>
                <span className="font-semibold text-ink">In-process LRU</span> for stream signal
                vectors so the scoring worker never re-reads from Redis on hot keys.
              </li>
            </ul>
          </Section>

          <Section title="Failure handling">
            <ul className="space-y-2 text-sm text-ink/90">
              <li>
                Backend offline? The frontend falls back to an in-browser{' '}
                <code className="rounded bg-panel/70 px-1 py-0.5 text-xs">ViralSimulator</code> so
                the dashboard never goes blank.
              </li>
              <li>
                Groq timeout / 4xx? <code className="rounded bg-panel/70 px-1 py-0.5 text-xs">/api/explain</code>{' '}
                falls back to a deterministic heuristic narrative — UI shows a{' '}
                <span className="text-ink">Heuristic</span> chip instead of <span className="text-good">Groq · live</span>.
              </li>
              <li>
                WebSocket disconnect? Exponential backoff (250ms → 8s) with jitter; UI shows a
                connection chip.
              </li>
            </ul>
          </Section>

          <Section title="Database schema (sketch)">
            <pre className="overflow-x-auto rounded-xl border border-line/60 bg-panel/60 p-4 text-[12px] leading-relaxed text-ink/90">
{`-- streams: dimension table
streams (
  id            text primary key,
  platform      text not null,
  channel       text not null,
  title         text not null,
  category      text not null,
  started_at    timestamptz not null
);

-- signals: time-series, partitioned by day
signal_snapshots (
  stream_id     text references streams(id),
  ts            timestamptz not null,
  viewers       int,
  viewer_velocity   double precision,
  chat_velocity     double precision,
  sentiment         double precision,
  trend_match       double precision,
  anomaly_score     double precision,
  viral_score       int
) partition by range (ts);

create index on signal_snapshots (stream_id, ts desc);

-- alerts: append-only audit
viral_alerts (
  id            uuid primary key default gen_random_uuid(),
  stream_id     text references streams(id),
  kind          text check (kind in ('spike','rising')),
  viral_score   int,
  fired_at      timestamptz not null
);`}
            </pre>
          </Section>

          <Section title="Scaling strategy">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-ink/90 marker:text-ink3">
              <li>
                <span className="font-semibold text-ink">Horizontal workers</span>: scoring is
                stateless per (streamId, window). Shard by hash(streamId) across N workers via
                Redis consumer groups.
              </li>
              <li>
                <span className="font-semibold text-ink">Cold/hot tiering</span>: only the top
                ~500 streams stay in the Redis ZSET; long-tail streams score every 10s instead of
                every 1s.
              </li>
              <li>
                <span className="font-semibold text-ink">Postgres partitioning</span> by day on
                signal_snapshots so the working set fits in RAM.
              </li>
              <li>
                <span className="font-semibold text-ink">Edge WS</span>: terminate WebSockets at
                the edge (Cloudflare / Fly), publish from origin via Redis pub/sub.
              </li>
            </ol>
          </Section>

          <Section title="Future improvements">
            <ul className="grid gap-1.5 text-sm text-ink/90 sm:grid-cols-2">
              <Bullet k="Real chat sentiment" v="distilbert-finetuned · onnx" />
              <Bullet k="Cross-platform identity" v="resolve same creator across Twitch/YT" />
              <Bullet k="User favorites & follows" v="Supabase auth + rls" />
              <Bullet k="Replay mode" v="scrub the last hour of viral moments" />
            </ul>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Card({ children, tone, index }: { children: ReactNode; tone: string; index: number }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${tone} p-4 backdrop-blur`}>
      <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-md bg-bg/60 text-[10px] font-bold tabular-nums text-ink2">
        {index}
      </span>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-ink3">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Bullet({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-line/50 bg-panel/40 px-3 py-2">
      <span className="text-ink2">{k}</span>
      <span className="text-right font-semibold text-ink">{v}</span>
    </li>
  );
}

function DataFlow() {
  const nodes = [
    { label: 'Browser / Mobile', sub: 'event producer' },
    { label: 'API Gateway', sub: 'Fastify · WS' },
    { label: 'Redis Streams', sub: 'ingest log' },
    { label: 'Scoring Worker', sub: 'features → score' },
    { label: 'Ranking Store', sub: 'Redis ZSET + PG' },
    { label: 'WS Fan-out', sub: 'pub/sub → clients' },
  ];
  return (
    <div className="mt-8 overflow-x-auto">
      <div className="flex min-w-[760px] items-center gap-2">
        {nodes.map((n, i) => (
          <div key={n.label} className="flex items-center gap-2">
            <div className="rounded-xl border border-line/60 bg-panel/70 px-3 py-3 backdrop-blur">
              <div className="text-[11px] font-bold uppercase tracking-wider text-accent2">
                {n.sub}
              </div>
              <div className="mt-0.5 text-sm font-bold text-ink">{n.label}</div>
            </div>
            {i < nodes.length - 1 && (
              <span className="select-none text-lg text-ink3">→</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex min-w-[760px] items-center gap-2 pl-[60%]">
        <span className="rounded-md bg-accent/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
          ↳ Groq AI Explanation
        </span>
        <span className="rounded-md bg-good/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-good">
          ↳ Alert Dispatcher
        </span>
      </div>
    </div>
  );
}
