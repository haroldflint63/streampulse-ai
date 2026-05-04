'use client';
import { useEffect, useRef } from 'react';

/**
 * Tiny SVG spark-line — appends new values, drops oldest after `maxPoints`.
 * No charting library; we want zero kb of dependency for a 100-point line.
 */
export function SparkLine({ values, max, color = '#4f46e5' }: { values: number[]; max?: number; color?: string }) {
  const ref = useRef<SVGPathElement | null>(null);
  const w = 240;
  const h = 56;
  useEffect(() => {
    if (!ref.current) return;
    const ymax = max ?? Math.max(1, ...values);
    const step = w / Math.max(1, values.length - 1);
    const path = values
      .map((v, i) => {
        const x = i * step;
        const y = h - (v / ymax) * (h - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
    ref.current.setAttribute('d', path || `M0 ${h - 2} L${w} ${h - 2}`);
  }, [values, max]);

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block">
      <path ref={ref} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
