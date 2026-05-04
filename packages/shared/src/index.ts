/**
 * Wire-format types shared between client and server.
 * Keep this file dependency-free so it can be imported from any runtime
 * (Node, Edge, browser) without bundling concerns.
 */

export type WatchEventKind = 'play' | 'pause' | 'seek' | 'stop' | 'progress';

export interface WatchEvent {
  /** Stable per-session pseudo-id. No PII — generated client-side. */
  userId: string;
  movieId: string;
  event: WatchEventKind;
  /** Unix ms. */
  timestamp: number;
  /** Cumulative seconds the user has watched in this session. */
  watchSeconds: number;
  /** Idempotency key. Server dedupes on (userId, movieId, eventId). */
  eventId?: string;
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  description: string;
  posterUrl: string;
  /** Optional 16:9 landscape image for hero / tile layouts. */
  backdropUrl?: string;
  /** Direct video URL when available (e.g. Internet Archive .mp4). */
  streamUrl?: string;
  /** YouTube video id used as trailer fallback when streamUrl is missing. */
  trailerYoutubeId?: string;
  /** Approx runtime in minutes — used by drop-off threshold. */
  runtimeMinutes: number;
  tags: string[];
}

export interface AggregateMetrics {
  activeUsers: number;
  eventsPerSecond: number;
  totalEvents: number;
  totalWatchSeconds: number;
  /** Top movies by recent activity (descending). */
  topMovies: TopMovie[];
  /** Drop-off alerts surfaced in the last window. */
  dropOffAlerts: DropOffAlert[];
  /** Server timestamp of the snapshot. */
  serverTime: number;
}

export interface TopMovie {
  movieId: string;
  title: string;
  activeViewers: number;
  watchSeconds: number;
}

export interface DropOffAlert {
  movieId: string;
  title: string;
  /** 0-1 — fraction of sessions that stopped before 30% completion. */
  dropOffRate: number;
  sampleSize: number;
  timestamp: number;
}

export interface Insight {
  insight: string;
  recommendation: string;
  /** 'groq' | 'fallback' — UI shows a chip explaining provenance. */
  source: 'groq' | 'fallback';
  generatedAt: number;
}

/** Discriminated union of WS payloads. */
export type WsMessage =
  | { type: 'metrics'; data: AggregateMetrics }
  | { type: 'event'; data: WatchEvent }
  | { type: 'alert'; data: DropOffAlert }
  | { type: 'insight'; data: Insight }
  | { type: 'hello'; data: { serverId: string; demoMode: boolean } };

/** Lightweight result type for fail-soft service calls. */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <E = Error>(error: E): Result<never, E> => ({ ok: false, error });

/* ----------------------------------------------------------------------------
 * Viral Moment Engine — types
 * ----------------------------------------------------------------------------
 * StreamPulse models live streams as a time-series feature vector.  The viral
 * score is a weighted, bounded combination of normalized signals (each in
 * [0,1]).  See `apps/web/lib/viralEngine.ts` for the formula and weights.
 */

export type StreamPlatform = 'twitch' | 'youtube' | 'kick' | 'tiktok';
export type StreamCategory =
  | 'gaming'
  | 'irl'
  | 'esports'
  | 'music'
  | 'talk'
  | 'sports'
  | 'creative';

export interface LiveStream {
  id: string;
  platform: StreamPlatform;
  channel: string;
  title: string;
  category: StreamCategory;
  thumbnailUrl: string;
  startedAt: number;
  /** Most recent feature snapshot driving the viral score. */
  signals: ViralSignals;
  /** 0–100. Computed from signals via weighted sum. */
  viralScore: number;
  /** Short bullets explaining what drove the score, e.g. "Chat 3.2x normal". */
  reasons: string[];
  /** Last N viewer counts (rolling 60s) for sparklines + velocity. */
  viewerHistory: number[];
}

export interface ViralSignals {
  /** Current concurrent viewers. */
  viewers: number;
  /** % change in viewers over last 10 min. e.g. 0.42 = +42%. */
  viewerVelocity: number;
  /** Chat messages / second relative to channel baseline. 1.0 = normal. */
  chatVelocity: number;
  /** -1..1 — average sentiment of recent chat (NLP heuristic). */
  sentiment: number;
  /** 0..1 — match between title/category and current trending tags. */
  trendMatch: number;
  /** 0..1 — channel platform popularity (followers/log scale). */
  platformPopularity: number;
  /** 0..1 — z-score based abnormality detector (sudden spike likelihood). */
  anomalyScore: number;
}

export interface ViralExplanation {
  streamId: string;
  /** 0..1 confidence the stream is having a viral moment. */
  confidence: number;
  /** 1-2 sentence narrative for the "Why this stream is trending" panel. */
  narrative: string;
  /** 3–5 short bullets of the strongest contributing signals. */
  bullets: string[];
  source: 'groq' | 'fallback';
  generatedAt: number;
}

export interface ViralAlert {
  streamId: string;
  channel: string;
  title: string;
  viralScore: number;
  /** "spike" = sudden anomaly; "rising" = sustained climb. */
  kind: 'spike' | 'rising';
  timestamp: number;
}

/** Snapshot used by the dashboard's live-demo simulator. */
export interface ViralSnapshot {
  streams: LiveStream[];
  alerts: ViralAlert[];
  serverTime: number;
  /** Total events processed since the simulator started. */
  totalEvents: number;
  /** Events / second over the last 5s window. */
  eventsPerSecond: number;
}

