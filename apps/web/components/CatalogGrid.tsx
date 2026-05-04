'use client';
import Link from 'next/link';
import type { Movie, TopMovie } from '@streampulse/shared';

export function CatalogGrid({
  movies,
  topMovies,
}: {
  movies: Movie[];
  topMovies: TopMovie[];
}) {
  const viewerCount = (id: string) => topMovies.find((t) => t.movieId === id)?.activeViewers ?? 0;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {movies.map((m) => {
        const viewers = viewerCount(m.id);
        return (
          <Link
            key={m.id}
            href={`/watch/${encodeURIComponent(m.id)}`}
            className="group block overflow-hidden rounded-xl border border-line bg-panel shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-cardHover"
          >
            <div className="relative aspect-video overflow-hidden bg-panel2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.posterUrl}
                alt={m.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
              {viewers > 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-good animate-pulse-soft" />
                  {viewers} watching
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity duration-200 group-hover:bg-black/30 group-hover:opacity-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-ink shadow-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="px-3 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="truncate text-sm font-semibold text-ink">{m.title}</div>
                <div className="shrink-0 text-xs text-ink2">{m.runtimeMinutes} min</div>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {m.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-panel2 px-2 py-0.5 text-[10px] font-medium text-ink2"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
