'use client';
import type { Insight } from '@streampulse/shared';

export function InsightBanner({ insight }: { insight: Insight | null }) {
  return (
    <div className="rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 to-accent2/5 p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-ink">What's happening right now</div>
          </div>
          {insight ? (
            <>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/85">{insight.insight}</p>
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent/15 bg-white/60 px-3 py-2">
                <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
                  Suggested
                </span>
                <span className="text-sm text-ink/85">{insight.recommendation}</span>
              </div>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-ink2">Analyzing the first batch of sessions…</p>
          )}
        </div>
      </div>
    </div>
  );
}
