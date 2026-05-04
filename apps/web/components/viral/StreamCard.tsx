'use client';
import { motion } from 'framer-motion';
import type { LiveStream } from '@streampulse/shared';
import { ViralBadge } from './ViralBadge';
import { Sparkline } from './Sparkline';

interface Props {
  stream: LiveStream;
  active: boolean;
  spiking: boolean;
  onClick: () => void;
  rank: number;
}

const PLATFORM_LABEL: Record<LiveStream['platform'], string> = {
  twitch: 'Twitch',
  youtube: 'YouTube',
  kick: 'Kick',
  tiktok: 'TikTok',
};
const PLATFORM_DOT: Record<LiveStream['platform'], string> = {
  twitch: 'bg-[#9146ff]',
  youtube: 'bg-[#ff0033]',
  kick: 'bg-[#53fc18]',
  tiktok: 'bg-[#25f4ee]',
};

export function StreamCard({ stream, active, spiking, onClick, rank }: Props) {
  const viewers = stream.signals.viewers;
  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      animate={spiking ? { boxShadow: '0 0 0 1px rgba(255,49,88,0.6), 0 0 32px rgba(255,49,88,0.35)' } : {}}
      transition={{ layout: { type: 'spring', stiffness: 320, damping: 32 } }}
      className={`group relative flex w-full items-stretch gap-4 overflow-hidden rounded-xl border bg-panel/60 p-3 text-left backdrop-blur transition ${
        active ? 'border-accent2/60 bg-panel' : 'border-line/60 hover:border-line'
      }`}
    >
      {/* Rank pip */}
      <span className="absolute left-3 top-3 z-10 rounded-md bg-bg/70 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-ink2 backdrop-blur">
        #{rank}
      </span>

      <div className="relative h-[88px] w-[156px] shrink-0 overflow-hidden rounded-lg ring-1 ring-line/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stream.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-bad/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          <span className="h-1 w-1 rounded-full bg-white animate-pulse" /> Live
        </span>
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
          {viewers >= 1000 ? `${(viewers / 1000).toFixed(1)}K` : viewers}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-ink2">
              <span className={`h-1.5 w-1.5 rounded-full ${PLATFORM_DOT[stream.platform]}`} />
              <span className="font-medium">{stream.channel}</span>
              <span className="text-ink3">·</span>
              <span className="text-ink3">{PLATFORM_LABEL[stream.platform]}</span>
            </div>
            <div className="mt-0.5 line-clamp-1 text-sm font-semibold text-ink">
              {stream.title}
            </div>
          </div>
          <ViralBadge score={stream.viralScore} size="sm" pulsing={spiking} />
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink2">
            {stream.reasons.slice(0, 2).map((r) => (
              <span key={r} className="inline-flex items-center gap-1">
                <span className="h-0.5 w-0.5 rounded-full bg-ink3" /> {r}
              </span>
            ))}
            {stream.reasons.length === 0 && (
              <span className="text-ink3">No notable signals</span>
            )}
          </div>
          <Sparkline data={stream.viewerHistory} className="h-8 w-24 shrink-0" />
        </div>
      </div>
    </motion.button>
  );
}
