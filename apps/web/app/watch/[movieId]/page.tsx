'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Movie, WatchEvent } from '@streampulse/shared';
import { SAMPLE_MOVIES } from '@/lib/sampleMovies';
import { getMovie, getSimilar, postWatchEvent, API_BASE } from '@/lib/api';

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
      // If a backend exists, prefer its (richer) data, but always fall back
      // to the bundled sample so first paint is instant.
      const fromApi = API_BASE ? await getMovie(movieId) : null;
      if (!cancelled && fromApi) setMovie(fromApi);
      const sim = API_BASE ? await getSimilar(movieId) : [];
      if (!cancelled) {
        if (sim.length > 0) setSimilar(sim);
        else
          setSimilar(
            SAMPLE_MOVIES.filter((m) => m.id !== movieId)
              .sort(() => Math.random() - 0.5)
              .slice(0, 6),
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
      // Throttle progress emits to ~one every 5s.
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
      // Final stop event when leaving the page so the aggregator can close out.
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
      <main className="min-h-screen bg-bg p-6">
        <div className="mx-auto max-w-4xl text-center text-ink2">
          <p>Movie not found.</p>
          <Link href="/" className="mt-4 inline-block text-accent hover:text-accent2">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-12">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-sm text-ink2 hover:text-ink">← Dashboard</Link>
        <div className="text-xs text-ink2">
          Your watch events stream into the same pipeline as the simulator.
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-xl border border-line bg-black">
          {movie.streamUrl ? (
            <video
              ref={videoRef}
              src={movie.streamUrl}
              poster={movie.posterUrl}
              controls
              autoPlay
              playsInline
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
              No legal stream available for this title.
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-ink">{movie.title}</h1>
          <span className="font-mono text-sm text-ink2">{movie.year}</span>
          <span className="font-mono text-xs text-ink2">{movie.runtimeMinutes} min</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/80">{movie.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {movie.tags.map((t) => (
            <span key={t} className="rounded border border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink2">
              {t}
            </span>
          ))}
        </div>

        <h2 className="mt-10 text-xs uppercase tracking-wider text-ink2">Because you watched</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {similar.map((m) => (
            <Link
              key={m.id}
              href={`/watch/${encodeURIComponent(m.id)}`}
              className="group overflow-hidden rounded-md border border-line bg-panel transition hover:border-accent/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.posterUrl} alt={m.title} className="aspect-[2/3] w-full object-cover" loading="lazy" />
              <div className="px-2 py-1.5 text-[11px] truncate text-ink/90">{m.title}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
