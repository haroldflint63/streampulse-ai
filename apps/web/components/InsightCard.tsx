'use client';
import type { Insight } from '@streampulse/shared';

export function InsightCard({ insight }: { insight: Insight | null }) {
  return (
    <div className="rounded-xl border border-line bg-gradient-to-br from-panel to-panel2 p-5">
      <div className="flex items-center gap-2">
        <div className="text-xs uppercase tracking-wider text-ink2">AI Insight</div>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${
            insight?.source === 'groq' ? 'bg-accent/15 text-accent' : 'bg-line text-ink2'
          }`}
        >
          {insight?.source === 'groq' ? 'groq' : 'rule-based'}
        </span>
      </div>
      {insight ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-ink">{insight.insight}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink2">
            <span className="text-accent2">→</span> {insight.recommendation}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-ink2">Generating first insight…</p>
      )}
    </div>
  );
}
