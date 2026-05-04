'use client';
import type { Insight } from '@streampulse/shared';

export function InsightPanel({ insight }: { insight: Insight | null }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-gradient-to-br from-panel to-panel2 p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent2/15 text-accent2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V18h6v-1.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink">AI insight</div>
          {insight ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-ink/85">{insight.insight}</p>
              <div className="mt-3 rounded-lg border border-accent2/15 bg-accent2/5 px-3 py-2 text-sm text-ink/90">
                <span className="mr-1.5 text-xs font-semibold uppercase tracking-wide text-accent2">
                  Suggested
                </span>
                {insight.recommendation}
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink2">Analyzing live audience behavior…</p>
          )}
        </div>
      </div>
    </div>
  );
}
