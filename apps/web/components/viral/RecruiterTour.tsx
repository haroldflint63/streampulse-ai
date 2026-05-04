'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Step {
  title: string;
  body: string;
  highlight: string;
}

const STEPS: Step[] = [
  {
    title: '1. Live stream ingestion',
    body:
      'StreamPulse ingests viewer counts, chat events, and platform metadata as a continuous feature stream. Each stream is a time-series of normalized signals.',
    highlight: 'Frontend → API Gateway → Stream Ingestion (Kafka / Redis Streams in prod).',
  },
  {
    title: '2. Viral score calculation',
    body:
      'A worker scores each stream every second using a weighted blend of viewer velocity, chat velocity, sentiment, trend match, platform popularity, and an anomaly z-score.',
    highlight: 'score = 100 · Σ wᵢ · normalize(signalᵢ)',
  },
  {
    title: '3. AI explanation',
    body:
      'Top-ranked streams are sent to an LLM (Groq · Llama 3.1) for a natural-language "why is this trending" narrative. The UI animates it in live.',
    highlight: 'Server-side Groq call · API key never reaches the browser.',
  },
  {
    title: '4. Alert delivery',
    body:
      'When viral score crosses 80, an alert is dispatched on a WebSocket channel. The dashboard shows it animating in within ~50ms of the score crossing.',
    highlight: 'Pub/Sub fan-out → ws clients · idempotent on (streamId, kind).',
  },
  {
    title: '5. Architecture',
    body:
      'Frontend (Next.js 15 / App Router) ↔ Fastify API ↔ Redis Streams + Postgres ↔ scoring workers ↔ Groq. Falls back to in-browser simulator when the backend is offline so the demo never breaks.',
    highlight: 'See /architecture for the full diagram + data flow.',
  },
  {
    title: '6. Resume summary',
    body:
      'Built a real-time AI stream-discovery platform: TypeScript / Next.js / Fastify / WebSockets / Groq. Anomaly-based viral scoring, sub-second ranking updates, server-streamed AI narratives, recruiter-grade UI.',
    highlight: 'Open /case-study for tradeoffs, scaling notes, and the full system design.',
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onTriggerSpike?: () => void;
}

export function RecruiterTour({ open, onClose, onTriggerSpike }: Props) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!open) setI(0);
  }, [open]);
  // Fire a spike when the tour reaches step 4 (alert delivery).
  useEffect(() => {
    if (open && i === 3) onTriggerSpike?.();
  }, [open, i, onTriggerSpike]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-panel to-bg p-7 shadow-cardHover"
          >
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent2/20 blur-3xl" />
            <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent2/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent2">
                  Recruiter demo
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-ink3 transition hover:text-ink"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-ink">
                {STEPS[i]!.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink2">{STEPS[i]!.body}</p>
              <div className="mt-4 rounded-lg border border-accent2/25 bg-accent2/5 px-3 py-2.5 text-xs leading-relaxed text-ink/90">
                <span className="mr-1.5 font-bold uppercase tracking-wide text-accent2">tech</span>
                {STEPS[i]!.highlight}
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex gap-1.5">
                  {STEPS.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 w-6 rounded-full transition ${
                        idx === i ? 'bg-accent' : idx < i ? 'bg-accent/40' : 'bg-line'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setI(i - 1)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium text-ink2 transition hover:bg-panel hover:text-ink"
                    >
                      Back
                    </button>
                  )}
                  {i < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setI(i + 1)}
                      className="rounded-md bg-gradient-to-r from-accent to-accent2 px-4 py-1.5 text-xs font-bold text-white shadow-glow"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-gradient-to-r from-accent to-accent2 px-4 py-1.5 text-xs font-bold text-white shadow-glow"
                    >
                      Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
