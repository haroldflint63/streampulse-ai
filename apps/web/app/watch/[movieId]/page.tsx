'use client';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Movie, WatchEvent } from '@streampulse/shared';
import { AppHeader } from '../../../components/AppHeader';
import { MovieRow } from '../../../components/MovieRow';
import { SAMPLE_MOVIES } from '../../../lib/sampleMovies';
import { API_BASE, getMovie, getSimilar, postWatchEvent } from '../../../lib/api';

function uid() {
  return 'u_' + Math.random().toString(36).slice(2, 10);
}

export default function WatchPage({
  params,
}: {
  params: Promise<{ movieId: string }>;
}) {
  const { movieId } = use(params);
  const [movie, setMovie] = useState<Movie | null>(
    () => SAMPLE_MOVIES.find((m) => m.id === movieId) ?? null
  );
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const userId = useMemo(() => uid(), []);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load richer data from API if available.
  useEffect(() => {
    let on = true;
    if (API_BASE) {
      getMovie(movieId).then((m) => on && m && setMovie(m)).catch(() => {});
      getSimilar(movieId).then((s) => on && setSimilar(s)).catch(() => {});
    } else {
      setSimilar(SAMPLE_MOVIES.filter((m) => m.id !== movieId).slice(0, 6));
    }
    return () => {
      on = false;
    };
  }, [movieId]);

  // Telemetry → backend (no-op when API_BASE is empty).
  const send = (event: WatchEvent['event']) => {
    if (!movie) return;
    const v = videoRef.current;
    const evt: WatchEvent = {
      userId,
      movieId: movie.id,
      event,
      timestamp: Date.now(),
      watchSeconds: v ? Math.floor(v.currentTime) : 0,
    };
    void postWatchEvent(evt);
  };

  if (!movie) {
    return (
      <main className="min-h-screen bg-bg">
        <AppHeader />
        <div className="flex min-h-screen items-center justify-center text-ink2">
          Title not found.
          <Link href="/" className="ml-2 text-accent hover:underline">Go home</Link>
        </div>
      </main>
    );
  }

  const canPlay = Boolean(movie.streamUrl);

  return (
    <main className="min-h-screen bg-bg text-ink">
      <AppHeader />

      {/* Player */}
      <section className="relative w-full bg-black">
        <div className="relative mx-auto aspect-video max-h-[80vh] w-full max-w-[1500px]">
          {canPlay && !error ? (
            <video
              ref={videoRef}
              src={movie.streamUrl}
              poster={movie.backdropUrl ?? movie.posterUrl}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full bg-black"
              onLoadedMetadata={() => setLoaded(true)}
              onPlay={() => send('play')}
              onPause={() => send('pause')}
              onSeeked={() => send('seek')}
              onEnded={() => send('stop')}
              onError={() =>
                setError(
                  'This source is temporarily unavailable. Try another title from the catalog below.'
                )
              }
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-black/95 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-panel text-ink2">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <div className="max-w-md text-ink">
                {error ?? 'Trailer not yet available for this title.'}
              </div>
              {error && (
                <button
                  onClick={() => {
                    setError(null);
                    setLoaded(false);
                    requestAnimationFrame(() => videoRef.current?.load());
                  }}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-bg hover:bg-ink/90"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Title meta */}
      <section className="mx-auto max-w-[1400px] px-6 pt-10 lg:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink2 transition hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>

        <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {movie.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink2">
              <span className="font-medium text-ink">{movie.year}</span>
              <span>•</span>
              <span>{movie.runtimeMinutes} min</span>
              <span>•</span>
              <span className="rounded-md border border-line bg-panel px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink2">
                {canPlay ? 'HD' : 'Coming soon'}
              </span>
            </div>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/85">
              {movie.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {movie.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-medium text-ink2"
                >
                  {t}
                </span>
              ))}
            </div>
            {loaded && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-good/10 px-3 py-1.5 text-xs font-medium text-good">
                <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse-soft" />
                Stream telemetry active
              </div>
            )}
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="mt-14">
          <MovieRow title="More like this" movies={similar} />
        </section>
      )}

      <div className="h-10" />
    </main>
  );
}
