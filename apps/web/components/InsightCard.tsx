'use client';
import type { Insight } from '@streampulse/shared';

export function InsightCard({ insight }: { insight: Insight | null }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-ink">AI insight</div>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
            insight?.source === 'groq' ? 'bg-accent/10 text-accent' : 'bg-panel2 text-ink2'
          }`}
        >
          {insight?.source === 'groq' ? 'groq llama-3.1' : 'rule-based'}
        </span>
      </div>
      {insight ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-ink">{insight.insight}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink2">
            <span className="font-medium text-accent2">Recommendation · </span>
            {insight.recommendation}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-ink2">Generating first insight…</p>
      )}
    </div>
  );
}
