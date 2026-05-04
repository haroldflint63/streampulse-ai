'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AggregateMetrics,
  DropOffAlert,
  Insight,
  Movie,
  WsMessage,
} from '@streampulse/shared';
import { AppHeader } from '../components/AppHeader';
import { Hero } from '../components/Hero';
import { MovieRow } from '../components/MovieRow';
import { Stat } from '../components/Stat';
import { InsightPanel } from '../components/InsightPanel';
import { TopList, AlertList } from '../components/AnalyticsLists';
import { API_BASE, getMovies } from '../lib/api';
import { WsClient, type WsStatus } from '../lib/wsClient';
import { LocalSimulator } from '../lib/localSim';
import { SAMPLE_MOVIES } from '../lib/sampleMovies';

export default function HomePage() {
  const [catalog, setCatalog] = useState<Movie[]>(SAMPLE_MOVIES);
  const [metrics, setMetrics] = useState<AggregateMetrics | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [alerts, setAlerts] = useState<DropOffAlert[]>([]);
  const [status, setStatus] = useState<WsStatus>('idle');
  const simRef = useRef<LocalSimulator | null>(null);

  // Load catalog from API when available; fall back to bundled sample.
  useEffect(() => {
    let on = true;
    if (!API_BASE) return;
    getMovies()
      .then((m) => on && m.length > 0 && setCatalog(m))
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  // Connect to live metrics — server WS first, local simulator as fallback.
  useEffect(() => {
    if (API_BASE) {
      const wsUrl = API_BASE.replace(/^http/, 'ws') + '/ws';
      const client = new WsClient(wsUrl);
      const off = client.on((msg: WsMessage) => {
        if (msg.type === 'metrics') {
          setMetrics(msg.data);
          setAlerts(msg.data.dropOffAlerts);
        } else if (msg.type === 'insight') {
          setInsight(msg.data);
        } else if (msg.type === 'alert') {
          setAlerts((prev) =>
            [msg.data, ...prev.filter((a) => a.movieId !== msg.data.movieId)].slice(0, 5)
          );
        }
      });
      const offStatus = client.onStatus(setStatus);
      client.connect();
      return () => {
        off();
        offStatus();
        client.disconnect();
      };
    }
    // Local simulator fallback so the demo always feels alive.
    setStatus('open');
    const sim = new LocalSimulator(
      {
        onMetrics: (m) => {
          setMetrics(m);
          setAlerts(m.dropOffAlerts);
        },
        onInsight: setInsight,
      },
      { users: 80, hz: 6 }
    );
    simRef.current = sim;
    sim.start();
    return () => sim.stop();
  }, []);

  const featured = useMemo(() => {
    const playable = catalog.filter((m) => m.streamUrl);
    return playable[0] ?? catalog[0];
  }, [catalog]);

  const trending = useMemo(() => {
    if (!metrics?.topMovies?.length) return catalog;
    const order = new Map(metrics.topMovies.map((t, i) => [t.movieId, i]));
    return [...catalog].sort((a, b) => {
      const ai = order.has(a.id) ? (order.get(a.id) as number) : 999;
      const bi = order.has(b.id) ? (order.get(b.id) as number) : 999;
      return ai - bi;
    });
  }, [catalog, metrics]);

  const featuredViewers =
    metrics?.topMovies.find((t) => t.movieId === featured?.id)?.activeViewers ?? 0;

  const watchHours = metrics ? Math.round(metrics.totalWatchSeconds / 36) / 100 : 0;

  return (
    <main className="min-h-screen bg-bg text-ink">
      <AppHeader
        rightSlot={
          <span
            className={`hidden items-center gap-1.5 rounded-full border border-line bg-panel/70 px-3 py-1.5 text-[11px] font-medium backdrop-blur sm:inline-flex ${
              status === 'open' ? 'text-good' : 'text-ink2'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === 'open' ? 'bg-good animate-pulse-soft' : 'bg-ink3'
              }`}
            />
            {status === 'open' ? 'Live' : status}
          </span>
        }
      />

      {featured && <Hero movie={featured} viewers={featuredViewers} />}

      {/* Live analytics strip */}
      <section id="analytics" className="relative -mt-12 z-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Watching now"
              value={metrics?.activeUsers ?? 0}
              tone="accent"
              hint="Concurrent viewers across the catalog."
            />
            <Stat
              label="Watch hours today"
              value={watchHours.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              unit="hrs"
              tone="good"
              hint="Cumulative session time since midnight."
            />
            <Stat
              label="Active alerts"
              value={alerts.length}
              tone={alerts.length > 0 ? 'warn' : 'default'}
              hint={alerts.length > 0 ? 'Titles with elevated drop-off.' : 'No drop-off detected.'}
            />
          </div>
          <div className="mt-4">
            <InsightPanel insight={insight} />
          </div>
        </div>
      </section>

      {/* Catalog rows */}
      <section id="catalog" className="mt-14 space-y-2">
        <MovieRow
          title="Trending now"
          movies={trending.slice(0, 6)}
          topMovies={metrics?.topMovies}
          numbered
        />
        <MovieRow
          title="Continue exploring"
          movies={catalog}
          topMovies={metrics?.topMovies}
        />
      </section>

      {/* Analytics detail */}
      <section className="mx-auto mt-10 grid max-w-[1400px] gap-4 px-6 pb-20 lg:grid-cols-2 lg:px-10">
        <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-card">
          <div className="border-b border-line px-5 py-4">
            <div className="text-sm font-bold text-ink">Top titles right now</div>
            <div className="text-xs text-ink2">Ranked by live concurrent viewers.</div>
          </div>
          <TopList topMovies={metrics?.topMovies ?? []} catalog={catalog} />
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-card">
          <div className="border-b border-line px-5 py-4">
            <div className="text-sm font-bold text-ink">Drop-off alerts</div>
            <div className="text-xs text-ink2">Titles losing viewers in the first minute.</div>
          </div>
          <AlertList alerts={alerts} />
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-2 px-6 py-8 text-xs text-ink3 sm:flex-row sm:items-center lg:px-10">
          <div>
            © {new Date().getFullYear()} StreamPulse · Real-time streaming analytics demo.
          </div>
          <div>
            Sample media courtesy of the Blender Foundation, W3C, and Google.
          </div>
        </div>
      </footer>
    </main>
  );
}
