import type { WatchEvent } from '@streampulse/shared';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { log } from '../util/logger.js';

/**
 * Supabase persistence layer. All writes are fire-and-forget from the hot
 * path — they must never block event ingestion. If Supabase is unconfigured
 * or down, events still flow through the in-memory aggregator and the
 * dashboard keeps working; we just lose long-term storage.
 *
 * Required schema (run once in the Supabase SQL editor):
 *
 *   create table if not exists watch_events (
 *     id            bigserial primary key,
 *     event_id      text,
 *     user_id       text not null,
 *     movie_id      text not null,
 *     event         text not null,
 *     ts            timestamptz not null,
 *     watch_seconds int  not null,
 *     created_at    timestamptz default now(),
 *     unique (event_id)
 *   );
 *   create index if not exists watch_events_movie_ts on watch_events (movie_id, ts desc);
 */
let client: SupabaseClient | null = null;

export function initSupabase(): { ready: boolean } {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    log.warn('[supabase] disabled — SUPABASE_URL or SERVICE_ROLE_KEY missing');
    return { ready: false };
  }
  try {
    client = createClient(url, key, { auth: { persistSession: false } });
    log.info('[supabase] ready');
    return { ready: true };
  } catch (err) {
    log.error('[supabase] init failed', { err: String(err) });
    return { ready: false };
  }
}

export async function persistWatchEvent(evt: WatchEvent): Promise<void> {
  if (!client) return;
  try {
    const { error } = await client.from('watch_events').upsert(
      {
        event_id: evt.eventId ?? null,
        user_id: evt.userId,
        movie_id: evt.movieId,
        event: evt.event,
        ts: new Date(evt.timestamp).toISOString(),
        watch_seconds: evt.watchSeconds,
      },
      { onConflict: 'event_id', ignoreDuplicates: true },
    );
    if (error) throw error;
  } catch (err) {
    // Never throw — caller is the hot path.
    log.warn('[supabase] persist failed', { err: String(err) });
  }
}

export function isSupabaseReady(): boolean {
  return client !== null;
}
