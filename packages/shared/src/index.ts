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
