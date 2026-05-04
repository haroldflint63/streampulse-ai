/**
 * Client-side fallback. When NEXT_PUBLIC_API_BASE is empty (i.e. the API
 * isn't deployed yet), the dashboard runs an in-browser simulator so the
 * demo still feels alive.
 *
 * This is the SAME logic shape as the server simulator + aggregator, just
 * collapsed to a single class and emitting metrics directly to the UI.
 */
import type {
  AggregateMetrics,
  DropOffAlert,
  Insight,
  Movie,
  TopMovie,
  WatchEvent,
} from '@streampulse/shared';
import { SAMPLE_MOVIES } from './sampleMovies';

interface Session {
  userId: string;
  movieId: string;
  watchSeconds: number;
  intendedDuration: number;
  startedAt: number;
}

interface Listeners {
  onMetrics?: (m: AggregateMetrics) => void;
  onEvent?: (e: WatchEvent) => void;
  onAlert?: (a: DropOffAlert) => void;
  onInsight?: (i: Insight) => void;
}

export class LocalSimulator {
  private sessions = new Map<string, Session>();
  private movies: Movie[];
  private playable: Movie[];
  private timer: ReturnType<typeof setInterval> | null = null;
  private slowTimer: ReturnType<typeof setInterval> | null = null;
  private totalEvents = 0;
  private recent: number[] = [];
  /** completedSessions per movie. */
  private completed = new Map<string, Array<{ watchSeconds: number; finishedAt: number }>>();

  constructor(
    private listeners: Listeners,
    private opts: { users: number; hz: number } = { users: 80, hz: 6 },
  ) {
    this.movies = SAMPLE_MOVIES;
    this.playable = this.movies.filter((m) => m.streamUrl);
  }

  start(): void {
    if (this.timer) return;
    for (let i = 0; i < this.opts.users; i++) this.spawn();
    const periodMs = Math.max(80, Math.floor(1000 / this.opts.hz));
    this.timer = setInterval(() => this.tick(), periodMs);
    this.slowTimer = setInterval(() => this.broadcastMetrics(), 1500);
    // Static fallback insight; the real one comes from the API when present.
    this.listeners.onInsight?.({
      insight: 'Local demo mode — API backend not connected.',
      recommendation: 'Deploy the API or set NEXT_PUBLIC_API_BASE to see live AI insights.',
      source: 'fallback',
      generatedAt: Date.now(),
    });
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.slowTimer) clearInterval(this.slowTimer);
    this.timer = this.slowTimer = null;
    this.sessions.clear();
  }

  private spawn(): void {
    if (this.playable.length === 0) return;
    const movie = this.playable[Math.floor(Math.random() * this.playable.length)]!;
    const userId = `local-${Math.random().toString(36).slice(2, 9)}`;
    const runtime = movie.runtimeMinutes * 60;
    const willDropOff = Math.random() < 0.25;
    const intended = willDropOff
      ? runtime * (0.05 + Math.random() * 0.2)
      : runtime * (0.3 + Math.random() * 0.7);
    const s: Session = {
      userId,
      movieId: movie.id,
      watchSeconds: 0,
      intendedDuration: Math.floor(intended),
      startedAt: Date.now(),
    };
    this.sessions.set(userId, s);
    this.emit({
      userId,
      movieId: movie.id,
      event: 'play',
      timestamp: Date.now(),
      watchSeconds: 0,
      eventId: `${userId}-${s.startedAt}-play`,
    });
  }

  private tick(): void {
    const ids = Array.from(this.sessions.keys());
    if (ids.length === 0) return;
    const id = ids[Math.floor(Math.random() * ids.length)]!;
    const s = this.sessions.get(id);
    if (!s) return;
    s.watchSeconds += 1 + Math.floor(Math.random() * 4);

    if (s.watchSeconds >= s.intendedDuration) {
      const arr = this.completed.get(s.movieId) ?? [];
      arr.push({ watchSeconds: s.watchSeconds, finishedAt: Date.now() });
      while (arr.length > 100) arr.shift();
      this.completed.set(s.movieId, arr);
      this.emit({
        userId: s.userId,
        movieId: s.movieId,
        event: 'stop',
        timestamp: Date.now(),
        watchSeconds: s.watchSeconds,
        eventId: `${s.userId}-${s.startedAt}-stop-${s.watchSeconds}`,
      });
      this.sessions.delete(id);
      this.spawn();
      return;
    }

    const isSeek = Math.random() < 0.05;
    this.emit({
      userId: s.userId,
      movieId: s.movieId,
      event: isSeek ? 'seek' : 'progress',
      timestamp: Date.now(),
      watchSeconds: s.watchSeconds,
      eventId: `${s.userId}-${s.startedAt}-${isSeek ? 'seek' : 'p'}-${s.watchSeconds}`,
    });
  }

  private emit(e: WatchEvent): void {
    this.totalEvents += 1;
    this.recent.push(e.timestamp);
    const cutoff = Date.now() - 5_000;
    while (this.recent.length > 0 && (this.recent[0] ?? 0) < cutoff) this.recent.shift();
    this.listeners.onEvent?.(e);
  }

  private broadcastMetrics(): void {
    const now = Date.now();
    const eps = this.recent.length / 5;
    const movieAgg = new Map<string, { viewers: Set<string>; watchSeconds: number }>();
    for (const s of this.sessions.values()) {
      let m = movieAgg.get(s.movieId);
      if (!m) {
        m = { viewers: new Set(), watchSeconds: 0 };
        movieAgg.set(s.movieId, m);
      }
      m.viewers.add(s.userId);
      m.watchSeconds = Math.max(m.watchSeconds, s.watchSeconds);
    }

    const titleOf = (id: string) => this.movies.find((m) => m.id === id)?.title ?? id;
    const top: TopMovie[] = Array.from(movieAgg.entries())
      .map(([movieId, s]) => ({
        movieId,
        title: titleOf(movieId),
        activeViewers: s.viewers.size,
        watchSeconds: Math.round(s.watchSeconds),
      }))
      .sort((a, b) => b.activeViewers - a.activeViewers)
      .slice(0, 8);

    const alerts: DropOffAlert[] = [];
    for (const [movieId, sessions] of this.completed) {
      const recent = sessions.filter((c) => now - c.finishedAt < 5 * 60_000);
      if (recent.length < 4) continue;
      const movie = this.movies.find((m) => m.id === movieId);
      if (!movie) continue;
      const drops = recent.filter((r) => r.watchSeconds < movie.runtimeMinutes * 60 * 0.3).length;
      const rate = drops / recent.length;
      if (rate >= 0.5) {
        const alert: DropOffAlert = {
          movieId,
          title: movie.title,
          dropOffRate: rate,
          sampleSize: recent.length,
          timestamp: now,
        };
        alerts.push(alert);
        this.listeners.onAlert?.(alert);
      }
    }
    alerts.sort((a, b) => b.dropOffRate - a.dropOffRate);

    const totalWatch = Array.from(movieAgg.values()).reduce((a, b) => a + b.watchSeconds, 0);
    this.listeners.onMetrics?.({
      activeUsers: this.sessions.size,
      eventsPerSecond: eps,
      totalEvents: this.totalEvents,
      totalWatchSeconds: totalWatch,
      topMovies: top,
      dropOffAlerts: alerts.slice(0, 5),
      serverTime: now,
    });
  }
}
