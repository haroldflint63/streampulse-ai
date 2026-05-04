'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type {
  AggregateMetrics,
  DropOffAlert,
  Insight,
  Movie,
} from '@streampulse/shared';
import { Hero } from '../components/Hero';
import { MovieRow } from '../components/MovieRow';
import { InsightPanel } from '../components/InsightPanel';
import { TopList, AlertList } from '../components/AnalyticsLists';
import { Sidebar } from '../components/viral/Sidebar';
import { StatGlass } from '../components/viral/StatGlass';
import { RecruiterTour } from '../components/viral/RecruiterTour';
import { SAMPLE_MOVIES } from '../lib/sampleMovies';
import { LocalSimulator } from '../lib/localSim';

export default function HomePage() {
  const [metrics, setMetrics] = useState<AggregateMetrics | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [alerts, setAlerts] = useState<DropOffAlert[]>([]);
  const [tourOpen, setTourOpen] = useState(false);

  // Drive live viewer counts + AI insights via the in-browser simulator.
  // Same data shape we'd swap for a real WebSocket in production.
  useEffect(() => {
    const sim = new LocalSimulator(
      {
        onMetrics: (m) => {
          setMetrics(m);
          setAlerts(m.dropOffAlerts);
        },
        onInsight: setInsight,
      },
      { users: 120, hz: 8 },
    );
    sim.start();
    return () => sim.stop();
  }, []);

  // Featured = first title with a working stream URL. Stable across renders
  // so the Play <Link> is never replaced mid-click.
  const featured: Movie = useMemo(
    () => SAMPLE_MOVIES.find((m) => m.streamUrl) ?? SAMPLE_MOVIES[0]!,
    [],
  );

  // Sort the catalog by live viewers from the simulator.
  const trending = useMemo(() => {
    if (!metrics?.topMovies?.length) return SAMPLE_MOVIES;
    const order = new Map(metrics.topMovies.map((t, i) => [t.movieId, i]));
    return [...SAMPLE_MOVIES].sort((a, b) => {
      const ai = order.has(a.id) ? (order.get(a.id) as number) : 999;
      const bi = order.has(b.id) ? (order.get(b.id) as number) : 999;
      return ai - bi;
    });
  }, [metrics]);

  const featuredViewers =
    metrics?.topMovies.find((t) => t.movieId === featured.id)?.activeViewers ?? 0;
  const watchHours = metrics ? Math.round(metrics.totalWatchSeconds / 36) / 100 : 0;

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <TopBar onTour={() => setTourOpen(true)} />

        {/* Cinematic hero */}
        <Hero movie={featured} viewers={featuredViewers} />

        {/* Live analytics strip — overlapping the hero like Netflix's "Top 10" */}
        <section
          id="analytics"
          className="relative z-20 mx-auto -mt-20 max-w-[1400px] px-6 lg:px-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-3 sm:grid-cols-3"
          >
            <StatGlass
              label="Watching now"
              value={metrics?.activeUsers ?? 0}
              tone="accent"
              pulse
              hint="Concurrent viewers across the catalog"
            />
            <StatGlass
              label="Watch hours today"
              value={watchHours.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              tone="good"
              hint="Cumulative session time since midnight"
            />
            <StatGlass
              label="Active alerts"
              value={alerts.length}
              tone={alerts.length > 0 ? 'warn' : 'default'}
              hint={alerts.length > 0 ? 'Titles with elevated drop-off' : 'No drop-off detected'}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4"
          >
            <InsightPanel insight={insight} />
          </motion.div>
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
            movies={SAMPLE_MOVIES}
            topMovies={metrics?.topMovies}
          />
          <MovieRow
            title="Open-source cinema · Blender Foundation"
            movies={SAMPLE_MOVIES.filter((m) =>
              /Animation|Sci-Fi|Surreal|Drama/.test(m.tags.join(' ')),
            )}
            topMovies={metrics?.topMovies}
          />
        </section>

        {/* Analytics detail */}
        <section className="mx-auto mt-10 grid max-w-[1400px] gap-4 px-6 pb-16 lg:grid-cols-2 lg:px-10">
          <div className="overflow-hidden rounded-2xl border border-line/60 bg-panel/60 shadow-card backdrop-blur">
            <div className="border-b border-line/60 px-5 py-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink3">
                Ranking engine
              </div>
              <div className="text-sm font-semibold text-ink">Top titles right now</div>
            </div>
            <TopList topMovies={metrics?.topMovies ?? []} catalog={SAMPLE_MOVIES} />
          </div>
          <div className="overflow-hidden rounded-2xl border border-line/60 bg-panel/60 shadow-card backdrop-blur">
            <div className="border-b border-line/60 px-5 py-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink3">
                Alert dispatcher
              </div>
              <div className="text-sm font-semibold text-ink">Drop-off alerts</div>
            </div>
            <AlertList alerts={alerts} />
          </div>
        </section>

        {/* Recruiter rail */}
        <section className="mx-auto max-w-[1400px] px-6 pb-16 lg:px-10">
          <div className="relative overflow-hidden rounded-2xl border border-line/60 bg-gradient-to-br from-panel via-panel to-bg p-7">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent2/15 blur-3xl" />
            <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent2/30 bg-accent2/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent2">
                  For recruiters
                </span>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                  Built like a real streaming-platform engineering team would.
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink2">
                  Real-time ingestion, weighted-feature scoring, anomaly detection, LLM-powered
                  insights, WebSocket alert dispatch, and a failure-soft simulator fallback —
                  wired into a Netflix-style browsing experience.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTourOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent2 px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:brightness-110"
                >
                  Recruiter Demo →
                </button>
                <Link
                  href="/architecture"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-5 py-2.5 text-sm font-semibold text-ink backdrop-blur transition hover:bg-panel"
                >
                  Architecture
                </Link>
                <Link
                  href="/case-study"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-5 py-2.5 text-sm font-semibold text-ink backdrop-blur transition hover:bg-panel"
                >
                  Case study
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-line/40">
          <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-2 px-6 py-8 text-[11px] text-ink3 sm:flex-row sm:items-center lg:px-10">
            <div>
              © {new Date().getFullYear()} StreamPulse · Real-time streaming intelligence (demo).
            </div>
            <div className="flex gap-4">
              <Link href="/architecture" className="hover:text-ink">
                Architecture
              </Link>
              <Link href="/case-study" className="hover:text-ink">
                Case study
              </Link>
              <a
                href="https://github.com/haroldflint63/streampulse-ai"
                target="_blank"
                rel="noreferrer"
                className="hover:text-ink"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>

      <RecruiterTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}

function TopBar({ onTour }: { onTour: () => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 lg:left-60">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-6 py-5 lg:px-10">
        <div className="flex items-center gap-3 lg:hidden">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent2 text-xs font-black text-white shadow-glow">
            SP
          </span>
          <span className="text-base font-bold tracking-tight text-ink">StreamPulse</span>
        </div>
        <div className="hidden items-center gap-7 text-sm text-ink2 md:flex">
          <Link href="#catalog" className="hover:text-ink">
            Browse
          </Link>
          <Link href="#analytics" className="hover:text-ink">
            Analytics
          </Link>
          <Link href="/architecture" className="hover:text-ink">
            Architecture
          </Link>
          <Link href="/case-study" className="hover:text-ink">
            Case study
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onTour}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent2 px-4 py-1.5 text-xs font-bold text-white shadow-glow"
          >
            Recruiter Demo
          </button>
          <a
            href="https://github.com/haroldflint63/streampulse-ai"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-xs font-medium text-ink2 backdrop-blur transition hover:text-ink"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}
