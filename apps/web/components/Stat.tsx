'use client';
import { useEffect, useRef, useState } from 'react';

export function Stat({
  label,
  value,
  unit,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: 'default' | 'accent' | 'good' | 'warn' | 'bad';
}) {
  const [tick, setTick] = useState(0);
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value) {
      last.current = value;
      setTick((t) => t + 1);
    }
  }, [value]);
  const valueColor =
    tone === 'accent'
      ? 'text-accent'
      : tone === 'good'
        ? 'text-good'
        : tone === 'warn'
          ? 'text-warn'
          : tone === 'bad'
            ? 'text-bad'
            : 'text-ink';
  return (
    <div className="rounded-xl border border-line bg-panel p-5 shadow-card">
      <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink2">{label}</div>
      <div
        key={tick}
        className={`mt-3 flex items-baseline gap-1.5 text-4xl font-bold tabular-nums ${valueColor} animate-rise-in`}
      >
        <span>{value}</span>
        {unit && <span className="text-lg font-medium text-ink2">{unit}</span>}
      </div>
      {hint && <div className="mt-2 text-xs leading-relaxed text-ink2">{hint}</div>}
    </div>
  );
}
