'use client';
import type { TopMovie } from '@streampulse/shared';

export function TopMoviesList({ movies }: { movies: TopMovie[] }) {
  const max = Math.max(1, ...movies.map((m) => m.activeViewers));
  if (movies.length === 0) {
    return <div className="px-5 py-8 text-center text-sm text-ink2">Waiting for first events…</div>;
  }
  return (
    <ul className="divide-y divide-line">
      {movies.map((m, i) => (
        <li key={m.movieId} className="flex items-center gap-3 px-5 py-3">
          <div className="w-6 text-right font-mono text-xs text-ink2">{i + 1}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-ink">{m.title}</div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded bg-panel2">
              <div
                className="h-full rounded bg-accent transition-all duration-700"
                style={{ width: `${(m.activeViewers / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm text-ink">{m.activeViewers}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink2">viewers</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
