'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { getMovies } from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';
import { StatCard } from '@/components/StatCard';
import { InsightBanner } from '@/components/InsightBanner';
import { TopTitlesList } from '@/components/TopTitlesList';
import { AlertsList } from '@/components/AlertsList';
import { CatalogGrid } from '@/components/CatalogGrid';

const WS_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL) || '';

export default function DashboardPage() {
  const mode = useMemo<'live' | 'local'>(() => (WS_URL ? 'live' : 'local'), []);

  const [, setStatus] = useState<WsStatus>('idle');
  const [metrics, setMetrics] = useState<AggregateMetrics | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [movies, setMovies] = useState<Movie[]>(SAMPLE_MOVIES);
  const [, setLastAlert] = useState<DropOffAlert | null>(null);
  const eventsBuf = useRef<WatchEvent[]>([]);

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

  const watchHours = ((metrics?.totalWatchSeconds ?? 0) / 3600).toFixed(1);

  return (
    <main className="min-h-screen bg-bg">
      <AppHeader
        rightSlot={
          mode === 'local' ? (
            <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink2 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
              Demo data
            </span>
          ) : null
        }
      />

      <section className="mx-auto max-w-7xl px-6 pt-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Know what your audience is watching, the moment it happens.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink2">
            StreamPulse turns raw video player events into a live picture of who's watching what,
            where attention is sticking, and where it's slipping — so you can act before the numbers
            harden.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Watching now"
            value={metrics?.activeUsers ?? 0}
            tone="accent"
            hint="Active sessions in the last minute"
          />
          <StatCard
            label="Watch time today"
            value={watchHours}
            unit="hrs"
            hint="Total hours streamed across all titles"
          />
          <StatCard
            label="Titles needing attention"
            value={metrics?.dropOffAlerts.length ?? 0}
            tone={(metrics?.dropOffAlerts.length ?? 0) > 0 ? 'bad' : 'good'}
            hint="Audience drops off before the 30% mark"
          />
        </div>

        <div className="mt-6">
          <InsightBanner insight={insight} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-panel shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <div className="text-sm font-semibold text-ink">Top right now</div>
                <div className="text-xs text-ink2">Most-watched titles in the last minute</div>
              </div>
            </div>
            <TopTitlesList topMovies={metrics?.topMovies ?? []} catalog={movies} />
          </div>
          <div className="rounded-xl border border-line bg-panel shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <div className="text-sm font-semibold text-ink">Drop-off alerts</div>
                <div className="text-xs text-ink2">Where audiences are leaving early</div>
              </div>
            </div>
            <AlertsList alerts={metrics?.dropOffAlerts ?? []} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">Browse the catalog</h2>
            <p className="mt-1 text-sm text-ink2">
              Click any title to play it — your viewing data flows into the dashboard above.
            </p>
          </div>
        </div>
        <CatalogGrid movies={movies} topMovies={metrics?.topMovies ?? []} />
      </section>

      <footer className="border-t border-line bg-panel">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-ink2">
          <span>© 2026 StreamPulse · Open-source streaming analytics</span>
          <span>Built with Fastify, Next.js, Redis Streams, Cohere & Groq</span>
        </div>
      </footer>
    </main>
  );
}
