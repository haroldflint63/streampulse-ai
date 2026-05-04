import type { Movie, WatchEvent } from '@streampulse/shared';

export const API_BASE =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE) || '';

export async function getMovies(): Promise<Movie[]> {
  if (!API_BASE) return [];
  const res = await fetch(`${API_BASE}/movies`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`/movies ${res.status}`);
  const json = (await res.json()) as { movies: Movie[] };
  return json.movies;
}

export async function getMovie(id: string): Promise<Movie | null> {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}/movies/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = (await res.json()) as { movie: Movie };
  return json.movie;
}

export async function getSimilar(id: string): Promise<Movie[]> {
  if (!API_BASE) return [];
  const res = await fetch(`${API_BASE}/movies/${encodeURIComponent(id)}/similar`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { similar: Movie[] };
  return json.similar;
}

export async function postWatchEvent(evt: WatchEvent): Promise<void> {
  if (!API_BASE) return;
  // Fire-and-forget — keepalive lets it survive a navigation.
  await fetch(`${API_BASE}/watch-event`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(evt),
    keepalive: true,
  }).catch(() => {});
}

export async function getMetricsSnapshot(): Promise<unknown> {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}/metrics`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}
