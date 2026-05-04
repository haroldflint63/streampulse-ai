'use client';
import type { TopMovie, Movie } from '@streampulse/shared';

export function TopTitlesList({
  topMovies,
  catalog,
}: {
  topMovies: TopMovie[];
  catalog: Movie[];
}) {
  if (topMovies.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-ink2">
        Nothing playing yet. Pick a title below to get started.
      </div>
    );
  }
  const max = Math.max(1, ...topMovies.map((m) => m.activeViewers));
  return (
    <ul className="divide-y divide-line">
      {topMovies.slice(0, 6).map((m, i) => {
        const meta = catalog.find((c) => c.id === m.movieId);
        return (
          <li key={m.movieId} className="flex items-center gap-3 px-5 py-3">
            <div className="w-5 text-right text-xs font-semibold text-ink2 tabular-nums">{i + 1}</div>
            <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md bg-panel2">
              {meta && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={meta.posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{m.title}</div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-panel2">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                  style={{ width: `${(m.activeViewers / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-ink tabular-nums">{m.activeViewers}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink2">watching</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
