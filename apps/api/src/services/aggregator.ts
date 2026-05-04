import type {
  AggregateMetrics,
  DropOffAlert,
  Movie,
  TopMovie,
  WatchEvent,
} from '@streampulse/shared';

/**
 * In-process rolling-window aggregator. Maintains the metrics that drive the
 * dashboard: active users, EPS, top movies, total watch.
 *
 * Why in-process? Sub-millisecond reads for the WS broadcast loop. Source of
 * truth for historical analytics still belongs in Postgres (see supabase.ts).
 *
 * Idempotency: events with a duplicate eventId within the dedupe window are
 * dropped before any aggregation. Window-bounded so the dedupe set doesn't
 * grow unbounded under sustained load.
 */
const ACTIVE_WINDOW_MS = 60_000; // user counts as "active" for 60s after last event
const EPS_WINDOW_MS = 5_000; // events-per-second computed over a 5s window
const DEDUPE_WINDOW_MS = 5 * 60_000; // remember event ids for 5 minutes
const DROP_OFF_THRESHOLD = 0.3; // stops before 30% of runtime → counts as drop-off
const DROP_OFF_MIN_SAMPLES = 4; // don't fire alert until we have 4+ sessions
const DROP_OFF_ALERT_RATE = 0.5; // ≥50% of sessions dropped → alert

interface UserState {
  lastSeen: number;
  movieId: string;
}

interface MovieState {
  viewers: Set<string>;
  watchSeconds: number;
  /** Sessions that have ended in any way — used for drop-off rate. */
  completedSessions: Array<{ userId: string; watchSeconds: number; finishedAt: number }>;
}

export class Aggregator {
  private users = new Map<string, UserState>();
  private movies = new Map<string, MovieState>();
  /** Recent events used for both EPS calc and dedupe expiry. */
  private recent: Array<{ ts: number; id: string }> = [];
  private seenEventIds = new Map<string, number>();
  private totalEvents = 0;

  constructor(private catalog: () => Movie[]) {}

  /** Returns true if the event was applied (not a duplicate). */
  ingest(evt: WatchEvent): boolean {
    if (evt.eventId) {
      if (this.seenEventIds.has(evt.eventId)) return false;
      this.seenEventIds.set(evt.eventId, evt.timestamp);
    }
    this.recent.push({ ts: evt.timestamp, id: evt.eventId ?? '' });
    this.totalEvents += 1;

    const prev = this.users.get(evt.userId);
    this.users.set(evt.userId, { lastSeen: evt.timestamp, movieId: evt.movieId });

    // If the user switched movies, free their viewer slot on the previous one.
    if (prev && prev.movieId !== evt.movieId) {
      this.movies.get(prev.movieId)?.viewers.delete(evt.userId);
    }

    const ms = this.movieState(evt.movieId);
    ms.viewers.add(evt.userId);

    // Watch time: only credit between play/progress events to avoid double-counting.
    if (evt.event === 'progress' || evt.event === 'play') {
      // We trust client-reported cumulative watchSeconds; on a real platform
      // the server would diff against last-known to prevent client tampering.
      // Fine for analytics-grade telemetry, not for billing.
    }

    if (evt.event === 'stop' || evt.event === 'pause') {
      ms.completedSessions.push({
        userId: evt.userId,
        watchSeconds: evt.watchSeconds,
        finishedAt: evt.timestamp,
      });
      // Cap session history per movie so memory doesn't grow without bound.
      if (ms.completedSessions.length > 200) ms.completedSessions.shift();
      if (evt.event === 'stop') ms.viewers.delete(evt.userId);
    }

    // Replace per-movie watchSeconds with the max we've seen for the user
    // for this movie. Approximation for the demo; production stores per-session.
    ms.watchSeconds = Math.max(ms.watchSeconds, evt.watchSeconds);

    this.gc(evt.timestamp);
    return true;
  }

  snapshot(): AggregateMetrics {
    const now = Date.now();
    this.gc(now);

    const activeUsers = Array.from(this.users.values()).filter(
      (u) => now - u.lastSeen < ACTIVE_WINDOW_MS,
    ).length;

    const epsCutoff = now - EPS_WINDOW_MS;
    const recentCount = this.recent.filter((r) => r.ts >= epsCutoff).length;
    const eventsPerSecond = recentCount / (EPS_WINDOW_MS / 1000);

    const titleOf = (id: string): string =>
      this.catalog().find((m) => m.id === id)?.title ?? id;

    const topMovies: TopMovie[] = Array.from(this.movies.entries())
      .map(([movieId, s]): TopMovie => ({
        movieId,
        title: titleOf(movieId),
        activeViewers: s.viewers.size,
        watchSeconds: Math.round(s.watchSeconds),
      }))
      .filter((t) => t.activeViewers > 0 || t.watchSeconds > 0)
      .sort((a, b) => b.activeViewers - a.activeViewers || b.watchSeconds - a.watchSeconds)
      .slice(0, 8);

    const totalWatchSeconds = Array.from(this.movies.values()).reduce(
      (s, m) => s + m.watchSeconds,
      0,
    );

    return {
      activeUsers,
      eventsPerSecond,
      totalEvents: this.totalEvents,
      totalWatchSeconds,
      topMovies,
      dropOffAlerts: this.computeDropOffAlerts(now),
      serverTime: now,
    };
  }

  private computeDropOffAlerts(now: number): DropOffAlert[] {
    const alerts: DropOffAlert[] = [];
    for (const [movieId, s] of this.movies) {
      const recent = s.completedSessions.filter((c) => now - c.finishedAt < 5 * 60_000);
      if (recent.length < DROP_OFF_MIN_SAMPLES) continue;
      const movie = this.catalog().find((m) => m.id === movieId);
      if (!movie) continue;
      const runtimeSeconds = movie.runtimeMinutes * 60;
      const drops = recent.filter((r) => r.watchSeconds < runtimeSeconds * DROP_OFF_THRESHOLD).length;
      const rate = drops / recent.length;
      if (rate >= DROP_OFF_ALERT_RATE) {
        alerts.push({
          movieId,
          title: movie.title,
          dropOffRate: rate,
          sampleSize: recent.length,
          timestamp: now,
        });
      }
    }
    return alerts.sort((a, b) => b.dropOffRate - a.dropOffRate).slice(0, 5);
  }

  private movieState(id: string): MovieState {
    let s = this.movies.get(id);
    if (!s) {
      s = { viewers: new Set(), watchSeconds: 0, completedSessions: [] };
      this.movies.set(id, s);
    }
    return s;
  }

  private gc(now: number): void {
    const epsCutoff = now - EPS_WINDOW_MS;
    while (this.recent.length > 0 && (this.recent[0]?.ts ?? Infinity) < epsCutoff) {
      this.recent.shift();
    }
    // Expire dedupe entries.
    if (this.seenEventIds.size > 1000) {
      const cutoff = now - DEDUPE_WINDOW_MS;
      for (const [id, ts] of this.seenEventIds) {
        if (ts < cutoff) this.seenEventIds.delete(id);
      }
    }
    // Expire stale users from active set so the count doesn't drift up.
    if (this.users.size > 2000) {
      const cutoff = now - ACTIVE_WINDOW_MS * 2;
      for (const [id, st] of this.users) {
        if (st.lastSeen < cutoff) this.users.delete(id);
      }
    }
  }
}
