import type { Movie } from '@streampulse/shared';
import { SAMPLE_MOVIES } from '../data/sampleMovies.js';
import { CircuitBreaker } from '../util/circuitBreaker.js';
import { TtlCache } from '../util/cache.js';
import { log } from '../util/logger.js';

const breaker = new CircuitBreaker('tmdb');
const cache = new TtlCache<string, Movie[]>(15 * 60_000); // 15 min

const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

interface TmdbMovie {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  runtime?: number;
}

/**
 * Fetch popular movies — TMDB if a key is present, else the curated bundled
 * catalog. Either way the response contains playable Internet Archive URLs
 * because we always splice the bundled catalog in.
 */
export async function fetchMovies(): Promise<Movie[]> {
  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (!apiKey) {
    return SAMPLE_MOVIES;
  }

  return cache.getOrLoad('popular', async () => {
    try {
      const enriched = await breaker.run(async () => {
        const url = `${TMDB_BASE}/movie/popular?api_key=${apiKey}&page=1`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
        if (!res.ok) throw new Error(`tmdb ${res.status}`);
        const json = (await res.json()) as { results?: TmdbMovie[] };
        const tmdb = (json.results ?? []).slice(0, 12).map((m): Movie => ({
          id: `tmdb-${m.id}`,
          title: m.title,
          year: m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : 0,
          description: m.overview ?? '',
          posterUrl: m.poster_path ? `${POSTER_BASE}${m.poster_path}` : '',
          // No legal stream URL for current releases — frontend will show the
          // poster + tagline and disable the play button.
          runtimeMinutes: m.runtime ?? 110,
          tags: ['popular'],
        }));
        // Splice in the bundled IA catalog so the demo always has playable
        // content visible at the top of the grid.
        return [...SAMPLE_MOVIES, ...tmdb];
      });
      return enriched;
    } catch (err) {
      log.warn('tmdb failed, using bundled catalog', { err: String(err) });
      return SAMPLE_MOVIES;
    }
  });
}
