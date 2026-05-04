'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LiveStream, ViralExplanation } from '@streampulse/shared';
import { ViralBadge } from './ViralBadge';

interface Props {
  stream: LiveStream | null;
}

export function WhyTrending({ stream }: Props) {
  const [explain, setExplain] = useState<ViralExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch a Groq-powered narrative whenever the focused stream changes.
  useEffect(() => {
    if (!stream) return;
    let on = true;
    setLoading(true);
    const ctrl = new AbortController();
    fetch('/api/explain', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: stream.id,
        channel: stream.channel,
        title: stream.title,
        category: stream.category,
        platform: stream.platform,
        viralScore: stream.viralScore,
        signals: stream.signals,
        reasons: stream.reasons,
      }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ViralExplanation | null) => {
        if (on && data) setExplain(data);
      })
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
      ctrl.abort();
    };
  }, [stream?.id, stream?.viralScore]);

  if (!stream) {
    return (
      <div className="rounded-2xl border border-line/60 bg-panel/60 p-6 text-sm text-ink2 backdrop-blur">
        Pick a stream to see why it&apos;s trending.
      </div>
    );
  }

  const confidence = explain?.confidence ?? stream.viralScore / 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line/60 bg-gradient-to-br from-panel/90 to-panel2/60 p-5 backdrop-blur">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent2/15 blur-3xl" />
      <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-accent2">
            <span className="h-1 w-1 rounded-full bg-accent2 animate-pulse" /> Why this stream is trending
          </div>
          <div className="mt-1 truncate text-base font-bold text-ink">{stream.channel}</div>
          <div className="line-clamp-1 text-xs text-ink2">{stream.title}</div>
        </div>
        <ViralBadge score={stream.viralScore} size="lg" pulsing />
      </div>

      <div className="relative mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <AnimatePresence mode="wait">
            <motion.p
              key={explain?.narrative ?? 'loading'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm leading-relaxed text-ink/90"
            >
              {loading && !explain
                ? 'Analyzing live signals…'
                : explain?.narrative ?? 'Stream is showing classic spike behavior across multiple signals.'}
            </motion.p>
          </AnimatePresence>

          <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {(explain?.bullets ?? stream.reasons).slice(0, 4).map((b, i) => (
              <motion.li
                key={`${b}-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 rounded-md bg-bg/40 px-2.5 py-1.5 text-xs text-ink/85"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {b}
              </motion.li>
            ))}
          </ul>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                explain?.source === 'groq' ? 'bg-good/15 text-good' : 'bg-ink3/20 text-ink2'
              }`}
            >
              {explain?.source === 'groq' ? 'Groq · live' : 'Heuristic'}
            </span>
            <span className="text-[11px] text-ink3">
              Updated {new Date(explain?.generatedAt ?? Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <ConfidenceDial value={confidence} />
      </div>
    </div>
  );
}

function ConfidenceDial({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  return (
    <div className="relative flex h-[110px] w-[110px] items-center justify-center self-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="dial" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#ff3158" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          stroke="url(#dial)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </svg>
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-ink3">Confidence</div>
        <div className="text-2xl font-black tabular-nums text-ink">{pct}%</div>
      </div>
    </div>
  );
}
