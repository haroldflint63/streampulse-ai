import type { LiveStream, ViralSignals } from '@streampulse/shared';

/**
 * Viral Moment Engine
 * -------------------
 * Each signal is normalized to [0,1] then combined with hand-tuned weights.
 * Weights reflect product-level priors: anomaly + chat velocity dominate
 * because they are the strongest leading indicators of "this is going viral
 * RIGHT NOW" in real platforms (Twitch live ops, TikTok Spike).
 *
 * score = 100 * Σ wᵢ · fᵢ(signalᵢ)   where Σ wᵢ = 1
 */
export const VIRAL_WEIGHTS = {
  viewerVelocity: 0.22,
  chatVelocity: 0.22,
  anomalyScore: 0.2,
  sentiment: 0.12,
  trendMatch: 0.12,
  platformPopularity: 0.07,
  viewersBase: 0.05,
} as const;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** Map raw signals → [0,1] feature space, then apply weights. */
export function scoreStream(s: ViralSignals): number {
  const f = {
    // viewer growth: +50% in 10 min ≈ 0.95
    viewerVelocity: clamp01(sigmoid(s.viewerVelocity * 4 - 1)),
    // chat 1x = 0.5, 3x = ~0.95
    chatVelocity: clamp01(sigmoid((s.chatVelocity - 1) * 1.6)),
    anomalyScore: clamp01(s.anomalyScore),
    // sentiment lives in [-1,1], strongest viral when very positive
    sentiment: clamp01((s.sentiment + 1) / 2),
    trendMatch: clamp01(s.trendMatch),
    platformPopularity: clamp01(s.platformPopularity),
    // viewer base — log-bounded so a 50k stream isn't 10x stronger than 5k
    viewersBase: clamp01(Math.log10(Math.max(1, s.viewers)) / 5),
  };
  const w = VIRAL_WEIGHTS;
  const raw =
    f.viewerVelocity * w.viewerVelocity +
    f.chatVelocity * w.chatVelocity +
    f.anomalyScore * w.anomalyScore +
    f.sentiment * w.sentiment +
    f.trendMatch * w.trendMatch +
    f.platformPopularity * w.platformPopularity +
    f.viewersBase * w.viewersBase;
  return Math.round(clamp01(raw) * 100);
}

/** Human-readable bullets explaining what's driving the score. */
export function explainStream(s: ViralSignals): string[] {
  const reasons: string[] = [];
  if (s.viewerVelocity >= 0.15) {
    reasons.push(`Viewers up ${Math.round(s.viewerVelocity * 100)}% in 10 min`);
  } else if (s.viewerVelocity <= -0.1) {
    reasons.push(`Viewers down ${Math.round(-s.viewerVelocity * 100)}%`);
  }
  if (s.chatVelocity >= 1.6) {
    reasons.push(`Chat velocity ${s.chatVelocity.toFixed(1)}× normal`);
  }
  if (s.anomalyScore >= 0.7) {
    reasons.push(`Anomaly detector firing (${Math.round(s.anomalyScore * 100)}%)`);
  }
  if (s.sentiment >= 0.4) {
    reasons.push('Sentiment spike: excitement');
  } else if (s.sentiment <= -0.3) {
    reasons.push('Sentiment shift: frustration');
  }
  if (s.trendMatch >= 0.65) {
    reasons.push('Matches a trending category');
  }
  return reasons.slice(0, 4);
}

/** Score-based color tier for badges/cards. */
export function viralTier(score: number): 'cold' | 'warm' | 'hot' | 'fire' {
  if (score >= 85) return 'fire';
  if (score >= 70) return 'hot';
  if (score >= 50) return 'warm';
  return 'cold';
}

/** Helper used by the UI to sort streams by viral score (desc, stable on id). */
export function rankStreams(streams: LiveStream[]): LiveStream[] {
  return [...streams].sort((a, b) => {
    if (b.viralScore !== a.viralScore) return b.viralScore - a.viralScore;
    return a.id.localeCompare(b.id);
  });
}
