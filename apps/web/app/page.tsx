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
  const mode = useMemo<'live' | 'local'>(() => (WS_URL ? 'live' : 'local'), []);

  const [status, setStatus] = useState<WsStatus>('idle');
  const [metrics, setMetrics] = useState<AggregateMetrics | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [movies, setMovies] = useState<Movie[]>(SAMPLE_MOVIES);
  const [, setLastAlert] = useState<DropOffAlert | null>(null);

  const eventsBuf = useRef<WatchEvent[]>([]);
  const [events, setEvents] = useState<WatchEvent[]>([]);
  const epsHistory = useRef<number[]>(new Array(HISTORY_LEN).fill(0));
  const usersHistory = useRef<number[]>(new Array(HISTORY_LEN).fill(0));
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (mode !== 'live') return;
    void getMovies()
      .then((m) => {
        if (m.length > 0) setMovies(m);
      })
      .catch(() => {});
  }, [mode]);

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

  const playable = movies.filter((m) => m.streamUrl);

  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white shadow-card">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h3l3-9 6 18 3-9h3" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-ink">StreamPulse</div>
              <div className="text-xs text-ink2">Real-time streaming analytics</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus status={status} mode={mode} />
            <a
              href="https://github.com/haroldflint63/streampulse-ai"
              className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink2 transition hover:text-ink hover:shadow-card"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Live audience overview</h1>
          <p className="mt-1 text-sm text-ink2">
            Watch events stream in from every connected player and roll up into 60-second active-user
            counts, 5-second event throughput, and per-title viewer rankings. Drop-off alerts fire the
            moment a title starts losing audience early.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Active viewers"
            value={metrics?.activeUsers ?? 0}
            hint="Sessions with activity in the last 60 seconds"
            emphasize
          />
          <MetricCard
            label="Events / second"
            value={(metrics?.eventsPerSecond ?? 0).toFixed(1)}
            hint="Throughput over the last 5 seconds"
          />
          <MetricCard
            label="Watch time"
            value={Math.round((metrics?.totalWatchSeconds ?? 0) / 60)}
            unit="min"
            hint="Total minutes watched across all sessions"
          />
          <MetricCard
            label="Drop-off alerts"
            value={metrics?.dropOffAlerts.length ?? 0}
            hint="Titles losing >50% of viewers before 30% runtime"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-panel p-5 shadow-card">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="text-sm font-medium text-ink">Throughput</div>
                <div className="text-xs text-ink2">Events per second · last 80s</div>
              </div>
              <div className="font-mono text-xs text-ink2">
                peak {Math.max(0, ...epsHistory.current).toFixed(1)}
              </div>
            </div>
            <SparkLine values={epsHistory.current} color="#4f46e5" />
          </div>
          <div className="rounded-xl border border-line bg-panel p-5 shadow-card">
            <div className="mb-3 flex items-baseline justify-between">
              <div>
                <div className="text-sm font-medium text-ink">Concurrency</div>
                <div className="text-xs text-ink2">Active viewers · last 80s</div>
              </div>
              <div className="font-mono text-xs text-ink2">
                peak {Math.max(0, ...usersHistory.current)}
              </div>
            </div>
            <SparkLine values={usersHistory.current} color="#0ea5e9" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-line bg-panel shadow-card lg:col-span-2">
            <div className="border-b border-line px-5 py-3">
              <div className="text-sm font-medium text-ink">Top titles by active viewers</div>
              <div className="text-xs text-ink2">Updated every 1.5 seconds</div>
            </div>
            <TopMoviesList movies={metrics?.topMovies ?? []} />
          </div>
          <div className="space-y-4">
            <InsightCard insight={insight} />
            <div className="rounded-xl border border-line bg-panel shadow-card">
              <div className="border-b border-line px-5 py-3">
                <div className="text-sm font-medium text-ink">Drop-off alerts</div>
                <div className="text-xs text-ink2">Titles losing audience early</div>
              </div>
              <DropOffPanel alerts={metrics?.dropOffAlerts ?? []} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-line bg-panel shadow-card lg:col-span-2">
            <div className="border-b border-line px-5 py-3">
              <div className="text-sm font-medium text-ink">Live event stream</div>
              <div className="text-xs text-ink2">Most recent watch events from every connected player</div>
            </div>
            <ActivityFeed events={events} />
          </div>
          <div className="rounded-xl border border-line bg-panel p-5 shadow-card">
            <div className="text-sm font-medium text-ink">Try it yourself</div>
            <p className="mt-1 text-xs text-ink2">
              Open any title — your play, pause, seek, and progress events will appear in the live stream
              and roll up into the metrics above.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {playable.slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  href={`/watch/${encodeURIComponent(m.id)}`}
                  className="group block overflow-hidden rounded-lg border border-line bg-white transition hover:border-accent hover:shadow-cardHover"
                >
                  <div className="aspect-video bg-panel2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                  <div className="px-2.5 py-2">
                    <div className="truncate text-[12px] font-medium text-ink">{m.title}</div>
                    <div className="text-[10px] text-ink2">{m.runtimeMinutes} min</div>
                  </div>
                </Link>
              ))}
            </div>
            {playable.length > 4 && (
              <Link
                href={`/watch/${encodeURIComponent(playable[0]!.id)}`}
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent2"
              >
                Browse the full catalog →
              </Link>
            )}
          </div>
        </div>

        <footer className="mt-10 border-t border-line pt-5 text-xs text-ink2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              {API_BASE ? (
                <span>
                  Connected to <span className="font-mono text-ink/80">{API_BASE}</span>
                </span>
              ) : (
                <span>
                  Demo mode — events are aggregated client-side. To run with the live backend, set
                  <code className="mx-1 rounded bg-panel2 px-1.5 py-0.5 font-mono text-[11px]">NEXT_PUBLIC_WS_URL</code>.
                </span>
              )}
            </div>
            <div>Fastify · Next.js · Redis Streams · Cohere · Groq</div>
          </div>
        </footer>
      </section>
    </main>
  );
}
