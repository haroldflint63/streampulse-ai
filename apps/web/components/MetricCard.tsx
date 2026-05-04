'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Numeric metric card with subtle "tick" animation when the value changes.
 * Animation is purely opacity so it's GPU-cheap and respects reduced-motion.
 */
export function MetricCard({
  label,
  value,
  unit,
  hint,
  emphasize,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  emphasize?: boolean;
}) {
  const [tick, setTick] = useState(0);
  const lastVal = useRef(value);
  useEffect(() => {
    if (lastVal.current !== value) {
      lastVal.current = value;
      setTick((t) => t + 1);
    }
  }, [value]);

  return (
    <div
      className={`rounded-xl border bg-panel px-5 py-4 shadow-card transition-shadow hover:shadow-cardHover ${
        emphasize ? 'border-accent/40' : 'border-line'
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-ink2">{label}</div>
      <div
        key={tick}
        className="mt-2 flex items-baseline gap-1.5 font-mono text-3xl font-semibold text-ink animate-rise-in"
      >
        <span>{value}</span>
        {unit && <span className="text-base font-normal text-ink2">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-ink2">{hint}</div>}
    </div>
  );
}
