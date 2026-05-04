'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type {
  AggregateMetrics,
  DropOffAlert,
  Insight,
  Movie,
  WatchEvent,
} from '@streampulse/shared';
import { WsClient, type WsStatus } from '@/lib/wsClient';
import { LocalSimulator } from '@/lib/localSim';
import { SAMPLE_MOVIES } from '@/lib/sampleMovies';
import { getMovies, API_BASE } from '@/lib/api';
import { MetricCard } from '@/components/MetricCard';
import { SparkLine } from '@/components/SparkLine';
import { TopMoviesList } from '@/components/TopMoviesList';
import { DropOffPanel } from '@/components/DropOffPanel';
import { InsightCard } from '@/components/InsightCard';
import { ActivityFeed } from '@/components/ActivityFeed';
import { ConnectionStatus } from '@/components/ConnectionStatus';

const WS_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL) || '';

const HISTORY_LEN = 80;

export default function DashboardPage() {
  // Mode: 'live' if a backend WS is configured, 'local' if we run the
  // in-browser simulator instead.
  const mode = useMemo<'live' | 'local'>(() => (WS_URL ? 'live' : 'local'), []);

  const [status, setStatus] = useState<WsStatus>('idle');
  const [metrics, setMetrics] = useState<AggregateMetrics | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [movies, setMovies] = useState<Movie[]>(SAMPLE_MOVIES);
  const [, setLastAlert] = useState<DropOffAlert | null>(null);

  // Buffered live state — we batch updates into a 1s setState to avoid
  // re-render storms when EPS gets high.
  const eventsBuf = useRef<WatchEvent[]>([]);
  const [events, setEvents] = useState<WatchEvent[]>([]);
  const epsHistory = useRef<number[]>(new Array(HISTORY_LEN).fill(0));
  const usersHistory = useRef<number[]>(new Array(HISTORY_LEN).fill(0));
  const [, forceTick] = useState(0);

  // Catalog (only relevant in live mode — local mode uses bundled sample).
  useEffect(() => {
    if (mode !== 'live') return;
    void getMovies()
      .then((m) => {
        if (m.length > 0) setMovies(m);
      })
      .catch(() => {});
  }, [mode]);

  // Wire the data source.
  useEffect(() => {
    if (mode === 'live') {
      const client = new WsClient(WS_URL);
      const offS = client.onStatus(setStatus);
      const offM = client.on((msg) => {
        if (msg.type === 'metrics') setMetrics(msg.data);
        else if (msg.type === 'event') eventsBuf.current.push(msg.data);
        else if (msg.type === 'alert') setLastAlert(msg.data);
        else if (msg.type === 'insight') setInsight(msg.data);
      });
      client.connect();
      return () => {
        offS();
        offM();
        client.disconnect();
      };
    }

    // Local mode: in-browser simulator.
    const sim = new LocalSimulator(
      {
        onMetrics: setMetrics,
        onEvent: (e) => eventsBuf.current.push(e),
        onAlert: setLastAlert,
        onInsight: setInsight,
      },
      { users: 80, hz: 6 },
    );
    sim.start();
    return () => sim.stop();
  }, [mode]);

  // Single 1s timer that flushes the event buffer and updates spark histories.
  useEffect(() => {
    const t = setInterval(() => {
      if (eventsBuf.current.length > 0) {
        const merged = [...eventsBuf.current.reverse(), ...events].slice(0, 60);
        eventsBuf.current = [];
        setEvents(merged);
      }
      epsHistory.current = [...epsHistory.current.slice(1), metrics?.eventsPerSecond ?? 0];
      usersHistory.current = [...usersHistory.current.slice(1), metrics?.activeUsers ?? 0];
      forceTick((x) => x + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [events, metrics?.eventsPerSecond, metrics?.activeUsers]);

  const playable = movies.filter((m) => m.streamUrl).slice(0, 8);

  return (
    <main className="min-h-screen bg-bg">
      <div className="bg-grid">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-bg">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 12h3l3-9 6 18 3-9h3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-ink">StreamPulse AI</div>
              <div className="text-xs text-ink2">Real-time streaming observability</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus status={status} mode={mode} />
            <a
              href="https://github.com/haroldflint63/streampulse-ai"
              className="rounded-md border border-line bg-panel px-3 py-1 text-xs text-ink2 hover:text-ink"
            >
              GitHub
            </a>
          </div>
        </header>
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard
            label="Active users"
            value={metrics?.activeUsers ?? 0}
            hint="Last 60s"
            emphasize
          />
          <MetricCard
            label="Events / sec"
            value={(metrics?.eventsPerSecond ?? 0).toFixed(1)}
            hint="5s rolling window"
          />
          <MetricCard
            label="Watch time"
            value={Math.round((metrics?.totalWatchSeconds ?? 0) / 60)}
            unit="min"
            hint="Across all sessions"
          />
          <MetricCard
            label="Drop-off alerts"
            value={metrics?.dropOffAlerts.length ?? 0}
            hint="Active right now"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-xs uppercase tracking-wider text-ink2">EPS — last 80s</div>
              <div className="font-mono text-xs text-ink2">
                peak {Math.max(0, ...epsHistory.current).toFixed(1)}
              </div>
            </div>
            <SparkLine values={epsHistory.current} color="#7c5cff" />
          </div>
          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-xs uppercase tracking-wider text-ink2">Active users — last 80s</div>
              <div className="font-mono text-xs text-ink2">
                peak {Math.max(0, ...usersHistory.current)}
              </div>
            </div>
            <SparkLine values={usersHistory.current} color="#36e3a8" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-line bg-panel">
            <div className="border-b border-line px-5 py-3 text-xs uppercase tracking-wider text-ink2">
              Top titles by active viewers
            </div>
            <TopMoviesList movies={metrics?.topMovies ?? []} />
          </div>
          <div className="space-y-4">
            <InsightCard insight={insight} />
            <div className="rounded-xl border border-line bg-panel">
              <div className="border-b border-line px-5 py-3 text-xs uppercase tracking-wider text-ink2">
                Drop-off alerts
              </div>
              <DropOffPanel alerts={metrics?.dropOffAlerts ?? []} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-line bg-panel">
            <div className="border-b border-line px-5 py-3 text-xs uppercase tracking-wider text-ink2">
              Live event stream
            </div>
            <ActivityFeed events={events} />
          </div>
          <div className="rounded-xl border border-line bg-panel p-5">
            <div className="text-xs uppercase tracking-wider text-ink2">Try it</div>
            <p className="mt-2 text-sm text-ink/80">
              Pick a title and your watch events flow into the same pipeline as the simulated traffic.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {playable.slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  href={`/watch/${encodeURIComponent(m.id)}`}
                  className="group block overflow-hidden rounded-md border border-line bg-panel2 transition hover:border-accent/60"
                >
                  <div className="aspect-[2/3] bg-bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.posterUrl} alt={m.title} className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100" loading="lazy" />
                  </div>
                  <div className="px-2 py-1.5 text-[11px] text-ink/90 truncate">{m.title}</div>
                </Link>
              ))}
            </div>
            <Link
              href="/watch/ia-night-of-the-living-dead"
              className="mt-4 inline-flex items-center gap-2 text-xs text-accent hover:text-accent2"
            >
              See full catalog →
            </Link>
          </div>
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-ink2">
          <div>
            {API_BASE ? (
              <span>Backend: <span className="font-mono text-ink/80">{API_BASE}</span></span>
            ) : (
              <span>Backend not deployed — running browser-side simulator. Events from the player still flow through the same aggregator.</span>
            )}
          </div>
          <div>Built with Fastify · Next.js · Redis Streams · Cohere · Groq</div>
        </footer>
      </section>
    </main>
  );
}
