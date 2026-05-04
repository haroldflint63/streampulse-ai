'use client';
import { useRef } from 'react';
import Link from 'next/link';
import type { Movie, TopMovie } from '@streampulse/shared';

export function MovieRow({
  title,
  movies,
  topMovies,
  numbered,
}: {
  title: string;
  movies: Movie[];
  topMovies?: TopMovie[];
  numbered?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };
  const viewerCount = (id: string) =>
    topMovies?.find((t) => t.movieId === id)?.activeViewers ?? 0;

  if (movies.length === 0) return null;

  return (
    <section className="group/row relative">
      <div className="mx-auto flex max-w-[1400px] items-end justify-between px-6 pb-3 lg:px-10">
        <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">{title}</h2>
        <div className="flex items-center gap-1 opacity-0 transition group-hover/row:opacity-100">
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-panel/80 text-ink2 transition hover:bg-panel hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-panel/80 text-ink2 transition hover:bg-panel hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="row-scroll mx-auto flex max-w-[1400px] gap-3 overflow-x-auto scroll-smooth px-6 pb-6 lg:px-10"
      >
        {movies.map((m, i) => {
          const viewers = viewerCount(m.id);
          return (
            <Link
              key={m.id}
              href={`/watch/${encodeURIComponent(m.id)}`}
              className="group/tile relative block w-[260px] shrink-0 sm:w-[300px] lg:w-[340px]"
            >
              <div className="relative aspect-video overflow-hidden rounded-lg bg-panel shadow-card transition-all duration-200 group-hover/tile:scale-[1.04] group-hover/tile:shadow-cardHover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.backdropUrl ?? m.posterUrl}
                  alt={m.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {numbered && (
                  <div className="absolute -left-1 -top-1 select-none text-[88px] font-black leading-none text-accent/90 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
                    {i + 1}
                  </div>
                )}
                {viewers > 0 && (
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse-soft" />
                    {viewers}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-10">
                  <div className="truncate text-sm font-semibold text-white">{m.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink2">
                    <span>{m.year}</span>
                    <span>•</span>
                    <span>{m.runtimeMinutes} min</span>
                    <span>•</span>
                    <span className="truncate">{m.tags[0]}</span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover/tile:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-bg shadow-lg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
