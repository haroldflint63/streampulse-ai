'use client';
import { motion } from 'framer-motion';
import { viralTier } from '../../lib/viralEngine';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  pulsing?: boolean;
}

const TIER_STYLE: Record<ReturnType<typeof viralTier>, string> = {
  fire: 'from-accent to-accent2 text-white shadow-glow',
  hot: 'from-accent/90 to-warn/80 text-white',
  warm: 'from-accent2/70 to-accent2/40 text-white',
  cold: 'from-ink3/40 to-ink3/20 text-ink',
};

const TIER_LABEL: Record<ReturnType<typeof viralTier>, string> = {
  fire: 'VIRAL',
  hot: 'HOT',
  warm: 'RISING',
  cold: 'STEADY',
};

export function ViralBadge({ score, size = 'md', pulsing = false }: Props) {
  const tier = viralTier(score);
  const px =
    size === 'lg' ? 'px-3.5 py-1.5 text-sm' : size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <motion.span
      key={score}
      initial={{ scale: 0.92, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className={`relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${TIER_STYLE[tier]} ${px} font-bold uppercase tracking-wider`}
    >
      {pulsing && tier !== 'cold' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      )}
      <span className="tabular-nums">{score}</span>
      <span className="opacity-90">{TIER_LABEL[tier]}</span>
    </motion.span>
  );
}
