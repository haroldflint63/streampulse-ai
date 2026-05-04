'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Movie, WatchEvent } from '@streampulse/shared';
import { SAMPLE_MOVIES } from '@/lib/sampleMovies';
import { getMovie, getSimilar, postWatchEvent, API_BASE } from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';

const sessionId =
  typeof window !== 'undefined'
    ? (window.sessionStorage.getItem('sp-uid') ??
       (() => {
         const id = `web-${Math.random().toString(36).slice(2, 9)}`;
         window.sessionStorage.setItem('sp-uid', id);
         return id;
       })())
    : 'ssr';

export default function WatchPage() {
  const params = useParams<{ movieId: string }>();
  const movieId = decodeURIComponent(params.movieId);

  const [movie, setMovie] = useState<Movie | null>(
    () => SAMPLE_MOVIES.find((m) => m.id === movieId) ?? null,
  );
  const [similar, setSimilar] = useState<Movie[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionStart = useMemo(() => Date.now(), []);
  const lastEmit = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const fromApi = API_BASE ? await getMovie(movieId) : null;
      if (!cancelled && fromApi) setMovie(fromApi);
      const sim = API_BASE ? await getSimilar(movieId) : [];
      if (!cancelled) {
        if (sim.length > 0) setSimilar(sim);
        else
          setSimilar(
            SAMPLE_MOVIES.filter((m) => m.id !== movieId).slice(0, 4),
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  const send = (kind: WatchEvent['event'], watchSeconds: number) => {
    const evt: WatchEvent = {
      userId: sessionId,
      movieId,
      event: kind,
      timestamp: Date.now(),
      watchSeconds: Math.floor(watchSeconds),
      eventId: `${sessionId}-${sessionStart}-${kind}-${Math.floor(watchSeconds)}`,
    };
    void postWatchEvent(evt);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => send('play', v.currentTime);
    const onPause = () => send('pause', v.currentTime);
    const onSeek = () => send('seek', v.currentTime);
    const onEnded = () => send('stop', v.currentTime);
    const onTime = () => {
      if (Date.now() - lastEmit.current > 5000) {
        lastEmit.current = Date.now();
        send('progress', v.currentTime);
      }
    };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('seeked', onSeek);
    v.addEventListener('ended', onEnded);
    v.addEventListener('timeupdate', onTime);
    return () => {
      send('stop', v.currentTime || 0);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('seeked', onSeek);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('timeupdate', onTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.id]);

  if (!movie) {
    return (
      <main className="min-h-screen bg-bg">
        <AppHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-2xl font-semibold text-ink">We couldn't find that title.</h1>
          <p className="mt-2 text-sm text-ink2">It may have been removed from the catalog.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-card transition hover:bg-accent/90"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg">
      <AppHeader />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink2 transition hover:text-ink"
        >
          <span aria-hidden>←</span> Back to dashboard
        </Link>

        <div className="overflow-hidden rounded-2xl border border-line bg-black shadow-card">
          {movie.streamUrl ? (
            <video
              ref={videoRef}
              src={movie.streamUrl}
              poster={movie.posterUrl}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black"
            />
          ) : movie.trailerYoutubeId ? (
            <iframe
              className="aspect-video w-full"
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerYoutubeId}`}
              title={movie.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-panel2 text-sm text-ink2">
              Streaming source unavailable for this title.
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-ink">{movie.title}</h1>
              <span className="text-sm text-ink2">{movie.year}</span>
              <span className="text-sm text-ink2">·</span>
              <span className="text-sm text-ink2">{movie.runtimeMinutes} min</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {movie.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-panel2 px-2.5 py-1 text-xs font-medium text-ink2"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-5 text-base leading-relaxed text-ink/80">{movie.description}</p>
          </div>

          <aside className="rounded-xl border border-line bg-panel p-5 shadow-card">
            <div className="text-sm font-semibold text-ink">Live engagement</div>
            <p className="mt-1.5 text-xs text-ink2">
              Every play, pause, seek, and view-progress event from this player is being sent to the
              dashboard in real time.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-ink transition hover:border-accent/50 hover:shadow-card"
            >
              Open dashboard in another tab →
            </Link>
          </aside>
        </div>

        {similar.length > 0 && (
          <>
            <h2 className="mt-12 text-lg font-semibold text-ink">More to watch</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {similar.map((m) => (
                <Link
                  key={m.id}
                  href={`/watch/${encodeURIComponent(m.id)}`}
                  className="group overflow-hidden rounded-xl border border-line bg-panel shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-cardHover"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div className="px-3 py-3">
                    <div className="truncate text-sm font-semibold text-ink">{m.title}</div>
                    <div className="text-xs text-ink2">{m.runtimeMinutes} min</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
