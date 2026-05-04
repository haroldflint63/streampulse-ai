'use client';
import Link from 'next/link';
import type { Movie } from '@streampulse/shared';

export function Hero({ movie, viewers }: { movie: Movie; viewers: number }) {
  const bg = movie.backdropUrl ?? movie.posterUrl;
  return (
    <section className="relative h-[78vh] min-h-[560px] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 hero-fade" />
      <div className="absolute inset-0 hero-fade-side" />

      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-6 pb-20 lg:px-10 lg:pb-28">
        <div className="max-w-2xl animate-fade-in">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="inline-block h-1 w-8 rounded-full bg-accent" />
            Featured
          </div>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
            {movie.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink2">
            <span className="font-medium text-ink">{movie.year}</span>
            <span>•</span>
            <span>{movie.runtimeMinutes} min</span>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              {movie.tags.slice(0, 3).map((t, i) => (
                <span key={t}>
                  {t}
                  {i < Math.min(movie.tags.length, 3) - 1 ? ',' : ''}
                </span>
              ))}
            </div>
            {viewers > 0 && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5 text-good">
                  <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse-soft" />
                  {viewers} watching now
                </span>
              </>
            )}
          </div>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/85 sm:text-lg">
            {movie.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/watch/${encodeURIComponent(movie.id)}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-semibold text-bg shadow-card transition hover:bg-ink/90"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </Link>
            <a
              href="#catalog"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-base font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              More info
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
