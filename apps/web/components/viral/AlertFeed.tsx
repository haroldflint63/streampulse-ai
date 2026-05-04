'use client';
import { AnimatePresence, motion } from 'framer-motion';
import type { ViralAlert } from '@streampulse/shared';

interface Props {
  alerts: ViralAlert[];
}

export function AlertFeed({ alerts }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line/60 bg-panel/60 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-ink3">Alert dispatcher</div>
          <div className="text-sm font-semibold text-ink">Live notifications</div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bg/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-good">
          <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" /> ws
        </span>
      </div>
      <div className="max-h-[280px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-ink3">
            No anomalies — start the live demo to trigger one.
          </div>
        ) : (
          <ul className="divide-y divide-line/40">
            <AnimatePresence initial={false}>
              {alerts.map((a) => (
                <motion.li
                  key={`${a.streamId}-${a.timestamp}`}
                  layout
                  initial={{ opacity: 0, x: -16, backgroundColor: 'rgba(255,49,88,0.18)' }}
                  animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                  exit={{ opacity: 0 }}
                  transition={{ backgroundColor: { duration: 1.6 } }}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${
                      a.kind === 'spike' ? 'bg-accent/20 text-accent' : 'bg-accent2/20 text-accent2'
                    }`}
                  >
                    {a.kind === 'spike' ? '↑↑' : '↑'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-ink">{a.channel}</span>
                      <span className="text-ink3">·</span>
                      <span className="text-ink3">
                        {a.kind === 'spike' ? 'Anomaly spike' : 'Sustained climb'}
                      </span>
                    </div>
                    <div className="line-clamp-1 text-[12px] text-ink2">{a.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black tabular-nums text-accent">{a.viralScore}</div>
                    <div className="text-[10px] text-ink3">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
