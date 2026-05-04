'use client';
import { motion } from 'framer-motion';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'accent' | 'good' | 'warn' | 'default';
  pulse?: boolean;
}

const TONE: Record<NonNullable<Props['tone']>, { ring: string; glow: string; text: string }> = {
  accent: { ring: 'ring-accent/30', glow: 'from-accent/20', text: 'text-accent' },
  good: { ring: 'ring-good/30', glow: 'from-good/20', text: 'text-good' },
  warn: { ring: 'ring-warn/30', glow: 'from-warn/20', text: 'text-warn' },
  default: { ring: 'ring-line', glow: 'from-accent2/15', text: 'text-ink' },
};

export function StatGlass({ label, value, hint, tone = 'default', pulse }: Props) {
  const t = TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden rounded-2xl border border-line/60 bg-panel/60 px-5 py-4 backdrop-blur ring-1 ring-inset ${t.ring}`}
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${t.glow} to-transparent blur-2xl`}
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink3">
          {label}
          {pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-good" />
            </span>
          )}
        </div>
        <div className={`mt-1 text-2xl font-black tabular-nums ${t.text}`}>{value}</div>
        {hint && <div className="mt-0.5 text-[11px] text-ink2">{hint}</div>}
      </div>
    </motion.div>
  );
}
