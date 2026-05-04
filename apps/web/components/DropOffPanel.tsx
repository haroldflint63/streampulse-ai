'use client';
import type { DropOffAlert } from '@streampulse/shared';

export function DropOffPanel({ alerts }: { alerts: DropOffAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-ink2">
        No drop-off alerts. All titles holding viewers past 30%.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {alerts.map((a) => (
        <li key={a.movieId} className="flex items-center gap-3 px-5 py-3">
          <span className="inline-block h-2 w-2 rounded-full bg-bad animate-pulse-soft" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-ink">{a.title}</div>
            <div className="text-xs text-ink2">
              {(a.dropOffRate * 100).toFixed(0)}% leave before 30% — {a.sampleSize} sessions
            </div>
          </div>
          <div className="font-mono text-sm text-bad">{(a.dropOffRate * 100).toFixed(0)}%</div>
        </li>
      ))}
    </ul>
  );
}
