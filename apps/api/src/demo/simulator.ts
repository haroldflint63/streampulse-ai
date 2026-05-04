import type { WatchEvent } from '@streampulse/shared';
import { fetchMovies } from '../services/tmdb.js';
import { log } from '../util/logger.js';

/**
 * Demo simulator — generates a realistic stream of synthetic watch events
 * so the dashboard has data to show even with zero real users.
 *
 * Mechanics:
 *  - Maintains N virtual sessions, each "watching" a movie.
 *  - Every tick, each session probabilistically emits a play/progress/seek.
 *  - A small fraction of sessions stop early — these become drop-off signals.
 *  - When a session ends, a new one spawns picking from the catalog so
 *    active-user count stays roughly steady.
 *
 * Tunable via env: DEMO_USERS (default 120), DEMO_EVENT_RATE_HZ (default 8).
 */
type Emit = (e: WatchEvent) => void;

interface Session {
  userId: string;
  movieId: string;
  startedAt: number;
  watchSeconds: number;
  /** When this session intends to stop, in seconds of watch. */
  intendedDuration: number;
}

export class Simulator {
  private sessions = new Map<string, Session>();
  private timer: NodeJS.Timeout | null = null;
  private movieIds: string[] = [];
  private movieRuntimes = new Map<string, number>();

  constructor(
    private opts: { users: number; eventRateHz: number },
    private emit: Emit,
  ) {}

  async start(): Promise<void> {
    const movies = await fetchMovies();
    // Only simulate movies we can actually play, so the demo links go somewhere.
    const playable = movies.filter((m) => m.streamUrl);
    this.movieIds = playable.map((m) => m.id);
    for (const m of playable) this.movieRuntimes.set(m.id, m.runtimeMinutes * 60);

    if (this.movieIds.length === 0) {
      log.warn('[sim] no playable movies, skipping start');
      return;
    }

    // Seed sessions.
    for (let i = 0; i < this.opts.users; i++) this.spawn();

    const periodMs = Math.max(50, Math.floor(1000 / this.opts.eventRateHz));
    this.timer = setInterval(() => this.tick(), periodMs);
    log.info('[sim] started', { users: this.opts.users, hz: this.opts.eventRateHz });
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.sessions.clear();
  }

  private spawn(): void {
    const userId = `demo-${Math.random().toString(36).slice(2, 9)}`;
    const movieId = this.movieIds[Math.floor(Math.random() * this.movieIds.length)]!;
    const runtime = this.movieRuntimes.get(movieId) ?? 5400;
    // ~25% of sessions intentionally drop off early to generate alerts.
    const willDropOff = Math.random() < 0.25;
    const intended = willDropOff
      ? runtime * (0.05 + Math.random() * 0.2) // 5-25%
      : runtime * (0.3 + Math.random() * 0.7);
    const sess: Session = {
      userId,
      movieId,
      startedAt: Date.now(),
      watchSeconds: 0,
      intendedDuration: Math.floor(intended),
    };
    this.sessions.set(userId, sess);
    this.emit({
      userId,
      movieId,
      event: 'play',
      timestamp: Date.now(),
      watchSeconds: 0,
      eventId: `${userId}-${sess.startedAt}-play`,
    });
  }

  private tick(): void {
    // Pick one session per tick at random — this naturally produces ~hz events/s.
    const ids = Array.from(this.sessions.keys());
    if (ids.length === 0) return;
    const id = ids[Math.floor(Math.random() * ids.length)]!;
    const s = this.sessions.get(id);
    if (!s) return;

    // Advance watch time by a realistic amount (each tick ~ 0.5–2s of content).
    const advance = 1 + Math.floor(Math.random() * 4);
    s.watchSeconds += advance;

    if (s.watchSeconds >= s.intendedDuration) {
      this.emit({
        userId: s.userId,
        movieId: s.movieId,
        event: 'stop',
        timestamp: Date.now(),
        watchSeconds: s.watchSeconds,
        eventId: `${s.userId}-${s.startedAt}-stop-${s.watchSeconds}`,
      });
      this.sessions.delete(id);
      // Maintain population.
      this.spawn();
      return;
    }

    // 5% chance of a seek, otherwise a progress tick.
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
}
