'use client';
import type { DropOffAlert } from '@streampulse/shared';

export function AlertsList({ alerts }: { alerts: DropOffAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-good/10 text-good">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium text-ink">All titles healthy</div>
          <div className="text-xs text-ink2">Audience is sticking past the 30% mark.</div>
        </div>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {alerts.map((a) => (
        <li key={a.movieId} className="flex items-center gap-3 px-5 py-3">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-bad" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{a.title}</div>
            <div className="text-xs text-ink2">
              {(a.dropOffRate * 100).toFixed(0)}% of viewers leave early · {a.sampleSize} sessions
            </div>
          </div>
          <div className="text-sm font-semibold text-bad tabular-nums">
            {(a.dropOffRate * 100).toFixed(0)}%
          </div>
        </li>
      ))}
    </ul>
  );
}
