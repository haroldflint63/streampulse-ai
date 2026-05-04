'use client';
import type { TopMovie, Movie, DropOffAlert } from '@streampulse/shared';

export function TopList({
  topMovies,
  catalog,
}: {
  topMovies: TopMovie[];
  catalog: Movie[];
}) {
  if (topMovies.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-ink2">
        Nothing playing yet.
      </div>
    );
  }
  const max = Math.max(1, ...topMovies.map((m) => m.activeViewers));
  return (
    <ul className="divide-y divide-line">
      {topMovies.slice(0, 5).map((m, i) => {
        const meta = catalog.find((c) => c.id === m.movieId);
        return (
          <li key={m.movieId} className="flex items-center gap-3 px-5 py-3">
            <div className="w-5 text-right text-xs font-bold text-ink2 tabular-nums">{i + 1}</div>
            <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md bg-panel2">
              {meta && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={meta.backdropUrl ?? meta.posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
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
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AlertList({ alerts }: { alerts: DropOffAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-good/15 text-good">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-ink">All titles healthy</div>
          <div className="text-xs text-ink2">No early drop-off detected.</div>
        </div>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {alerts.map((a) => (
        <li key={a.movieId} className="flex items-center gap-3 px-5 py-3">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-bad animate-pulse-soft" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{a.title}</div>
            <div className="text-xs text-ink2">
              {(a.dropOffRate * 100).toFixed(0)}% leaving early · {a.sampleSize} sessions
            </div>
          </div>
          <div className="text-sm font-bold text-bad tabular-nums">
            {(a.dropOffRate * 100).toFixed(0)}%
          </div>
        </li>
      ))}
    </ul>
  );
}
