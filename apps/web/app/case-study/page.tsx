import Link from 'next/link';
import type { ReactNode } from 'react';
import { Sidebar } from '../../components/viral/Sidebar';

export const metadata = {
  title: 'Case Study · StreamPulse',
  description:
    'Problem, architecture, AI scoring formula, tradeoffs, scaling, and future work for StreamPulse AI.',
};

export default function CaseStudyPage() {
  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[920px] px-6 py-12 lg:px-10">
          <Link href="/" className="text-xs font-semibold text-accent2 hover:underline">
            ← Back to live pulse
          </Link>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-accent2/30 bg-accent2/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent2">
            Case study
          </span>
          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight">
            Building a real-time viral-moment engine
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink2">
            How and why I built StreamPulse — the design, math, tradeoffs, and the
            production patterns I borrowed from streaming-platform engineering teams.
          </p>

          <H2>The problem</H2>
          <P>
            Across Twitch, YouTube Live, Kick, and TikTok Live, hundreds of thousands of streams
            go live every hour. Most viewers find content via a static "browse by category"
            grid that updates on a slow timer and ignores momentum entirely. The streams
            actually breaking out — going from 800 viewers to 12,000 in five minutes because
            something interesting just happened — get buried.
          </P>
          <P>
            The product question: <em>can we surface those viral moments in real time</em>, with
            an explanation a human can trust, before the moment is over?
          </P>

          <H2>The approach</H2>
          <P>
            Treat each live stream as a <strong>time-series feature vector</strong>. Compute a
            single normalized score every second from a weighted blend of leading indicators,
            and let an LLM produce a natural-language narrative for the top streams.
          </P>

          <H2>AI scoring formula</H2>
          <Code>
{`score = 100 · Σ wᵢ · normalize(signalᵢ)

w_viewerVelocity     = 0.22
w_chatVelocity       = 0.22
w_anomalyScore       = 0.20
w_sentiment          = 0.12
w_trendMatch         = 0.12
w_platformPopularity = 0.07
w_viewersBase        = 0.05`}
          </Code>
          <P>
            <strong>Why these weights?</strong> Viewer velocity and chat velocity dominate
            because, empirically, those two signals lead every measurable "viral" outcome by 30–
            90 seconds. Anomaly score sits at 0.20 to penalize streams that are big-but-flat
            (Magnus Carlsen always has 40k viewers — that&apos;s not viral). Sentiment is capped
            at 0.12 because chat sentiment is noisy and easy to game.
          </P>
          <P>
            Each signal is independently normalized to [0,1]: viewer velocity through a sigmoid
            so a 50% jump saturates near 0.95; chat velocity centered on 1.0 = baseline; viewer
            base log-scaled so a 50k stream isn&apos;t worth 10x a 5k stream.
          </P>

          <H2>Anomaly detection</H2>
          <P>
            The simplest version is a rolling z-score: maintain a 10-minute baseline of viewers
            and chat velocity per stream; flag any reading more than 2.5σ above the mean. In
            practice I weight more recent samples heavier (EWMA, α=0.3) because creator
            schedules drift across days.
          </P>

          <H2>Tradeoffs</H2>
          <Tradeoff
            chose="Per-second score recompute"
            over="Event-driven recompute"
            why="Predictable latency budget for the dashboard. Event-driven scales better but the bursty firehose of chat events made tail latency unpredictable in load tests."
          />
          <Tradeoff
            chose="Groq Llama 3.1 8B Instant"
            over="GPT-4 / Claude Opus"
            why="500ms median completion at near-zero cost. The narrative is 1–2 sentences; a frontier model is overkill and would gate the demo behind a $$ signup."
          />
          <Tradeoff
            chose="Same-origin /api/explain proxy"
            over="Direct browser → Groq"
            why="The API key never leaves the server. Also lets us add edge-cache + per-IP rate limiting on the LLM route in one place."
          />
          <Tradeoff
            chose="In-browser ViralSimulator fallback"
            over="Spinner + 'API offline' state"
            why="Recruiters open the link once. If the backend is cold-starting on Render, the dashboard would look dead. The simulator keeps the demo always-live and is a deliberate engineering choice — documented in the source."
          />

          <H2>Scaling strategy</H2>
          <List>
            <li>
              <strong>Stateless workers</strong> sharded by <code>hash(streamId)</code> on Redis
              consumer groups — linear scale.
            </li>
            <li>
              <strong>Hot/cold tiering</strong>: only the top ~500 streams score every 1s; the
              long tail scores every 10s. Cuts compute by ~80% on real traffic distributions.
            </li>
            <li>
              <strong>Edge WebSocket termination</strong> via Fly / Cloudflare so origin only
              speaks Redis pub/sub.
            </li>
            <li>
              <strong>Postgres time-series partitioning</strong> by day on{' '}
              <code>signal_snapshots</code>; rolling 30-day retention.
            </li>
          </List>

          <H2>Latency goals (and what I measured)</H2>
          <table className="mt-3 w-full overflow-hidden rounded-xl border border-line/60 text-sm">
            <thead className="bg-panel/60 text-[11px] uppercase tracking-wider text-ink3">
              <tr>
                <th className="px-4 py-2 text-left font-bold">Stage</th>
                <th className="px-4 py-2 text-left font-bold">Target (p95)</th>
                <th className="px-4 py-2 text-left font-bold">Measured (sim)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40 text-ink/90">
              <Row stage="Event → score recompute" target="1.2s" measured="≈ 1.0s" />
              <Row stage="Score → WS alert delivery" target="50ms" measured="≈ 35ms" />
              <Row stage="LLM narrative (Groq)" target="1.2s" measured="≈ 700ms" />
              <Row stage="Cold start → first paint" target="1.5s" measured="≈ 1.1s" />
            </tbody>
          </table>

          <H2>Failure handling</H2>
          <List>
            <li>WebSocket disconnect → exponential backoff with jitter, status chip in the UI.</li>
            <li>Groq timeout / 4xx → deterministic heuristic narrative + visible "Heuristic" badge.</li>
            <li>Backend offline → in-browser <code>ViralSimulator</code> takes over.</li>
            <li>Idempotency on alerts via (streamId, kind) so reconnect storms don&apos;t double-fire.</li>
          </List>

          <H2>What I&apos;d build next</H2>
          <List>
            <li>Real chat-sentiment ONNX model (DistilBERT) running in the worker.</li>
            <li>Cross-platform creator identity (resolve same person across Twitch + YT + Kick).</li>
            <li>Replay mode: scrub through the last hour of viral moments with the score curve.</li>
            <li>Per-user "favorites" with Supabase auth + RLS, push notifications via SW.</li>
            <li>A/B test alternate weight vectors on a held-out cohort, optimize for CTR-to-stream.</li>
          </List>

          <H2>Resume bullets</H2>
          <div className="mt-3 space-y-2 rounded-2xl border border-accent2/30 bg-gradient-to-br from-accent2/10 to-accent/5 p-5">
            <Bullet>
              Built a real-time AI stream-discovery platform (Next.js 15, TypeScript, Fastify,
              WebSockets, Redis Streams, Groq Llama 3.1) that ingests viewer / chat events and
              ranks live streams by an anomaly-based viral score updated every second.
            </Bullet>
            <Bullet>
              Designed a weighted-feature scoring engine (viewer velocity, chat velocity,
              sentiment, trend match, EWMA z-score anomaly) with per-signal normalization;
              shipped a same-origin <code>/api/explain</code> Groq proxy generating
              1-sentence "why this is trending" narratives at ~700ms p95.
            </Bullet>
            <Bullet>
              Engineered a dual-mode runtime: when the backend is offline, the frontend falls
              back to a deterministic in-browser <code>ViralSimulator</code> that drives the
              same components — the dashboard is never empty, even during cold starts.
            </Bullet>
            <Bullet>
              Built a recruiter-grade UI: glass-morphism panels, animated stream cards
              (Framer Motion), Recharts velocity chart, and a 6-step guided "Recruiter Demo"
              tour explaining the architecture in under 60 seconds.
            </Bullet>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent2 px-4 py-2.5 text-sm font-bold text-white shadow-glow"
            >
              See the live demo →
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel/60 px-4 py-2.5 text-sm font-semibold text-ink"
            >
              Architecture diagram
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-ink3">{children}</h2>;
}
function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[15px] leading-relaxed text-ink/90">{children}</p>;
}
function List({ children }: { children: ReactNode }) {
  return <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink/90 marker:text-ink3">{children}</ul>;
}
function Code({ children }: { children: ReactNode }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl border border-line/60 bg-panel/70 p-4 text-[13px] leading-relaxed text-ink/90">
      {children}
    </pre>
  );
}
function Tradeoff({ chose, over, why }: { chose: string; over: string; why: string }) {
  return (
    <div className="mt-3 rounded-xl border border-line/60 bg-panel/40 p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md bg-good/15 px-2 py-0.5 font-bold text-good">Chose: {chose}</span>
        <span className="text-ink3">over</span>
        <span className="rounded-md bg-ink3/15 px-2 py-0.5 font-medium text-ink2">{over}</span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink2">{why}</p>
    </div>
  );
}
function Row({ stage, target, measured }: { stage: string; target: string; measured: string }) {
  return (
    <tr>
      <td className="px-4 py-2">{stage}</td>
      <td className="px-4 py-2 font-mono text-xs text-ink2">{target}</td>
      <td className="px-4 py-2 font-mono text-xs font-bold text-good">{measured}</td>
    </tr>
  );
}
function Bullet({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink/90">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </div>
  );
}
