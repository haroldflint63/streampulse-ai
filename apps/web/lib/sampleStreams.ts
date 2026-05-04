import type { LiveStream, StreamCategory, StreamPlatform } from '@streampulse/shared';
import { explainStream, scoreStream } from './viralEngine';

/**
 * Seed catalog of fake live streams.  Thumbnails are SVG data URIs so the
 * dashboard renders even with strict CSP / no remote image domains.
 */

const gradient = (a: string, b: string, label: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="32" y="320" font-family="ui-sans-serif,system-ui" font-size="28" font-weight="700" fill="rgba(255,255,255,0.92)">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

interface Seed {
  id: string;
  platform: StreamPlatform;
  channel: string;
  title: string;
  category: StreamCategory;
  thumb: [string, string];
  baseViewers: number;
}

const SEEDS: Seed[] = [
  {
    id: 'str-001',
    platform: 'twitch',
    channel: 'NovaPlays',
    title: 'WORLD FIRST attempt — Mythic raid blind run',
    category: 'gaming',
    thumb: ['#7c5cff', '#ff3158'],
    baseViewers: 28_400,
  },
  {
    id: 'str-002',
    platform: 'kick',
    channel: 'OffTheGrid',
    title: 'IRL Tokyo at 3am — found a hidden ramen alley',
    category: 'irl',
    thumb: ['#ff3158', '#ffb547'],
    baseViewers: 12_100,
  },
  {
    id: 'str-003',
    platform: 'youtube',
    channel: 'GrandMasterChess',
    title: 'Titled Tuesday — Magnus vs Hikaru rematch live',
    category: 'esports',
    thumb: ['#00d4a8', '#7c5cff'],
    baseViewers: 41_900,
  },
  {
    id: 'str-004',
    platform: 'twitch',
    channel: 'LoFiCarter',
    title: 'late-night beats · take requests',
    category: 'music',
    thumb: ['#1c1f2a', '#7c5cff'],
    baseViewers: 4_800,
  },
  {
    id: 'str-005',
    platform: 'tiktok',
    channel: 'AvaSpeaks',
    title: 'reacting to the leaked NDA documents 🔥',
    category: 'talk',
    thumb: ['#ff4757', '#ffb547'],
    baseViewers: 67_200,
  },
  {
    id: 'str-006',
    platform: 'twitch',
    channel: 'BoltRacing',
    title: 'F1 sim · qualifying lap on Spa in the wet',
    category: 'sports',
    thumb: ['#0a84ff', '#00d4a8'],
    baseViewers: 9_500,
  },
  {
    id: 'str-007',
    platform: 'youtube',
    channel: 'PixelForge',
    title: 'speedpaint — character design from chat prompts',
    category: 'creative',
    thumb: ['#ff3158', '#7c5cff'],
    baseViewers: 2_300,
  },
  {
    id: 'str-008',
    platform: 'kick',
    channel: 'NightShift',
    title: 'horror run · Resident Evil Remake first time',
    category: 'gaming',
    thumb: ['#13151c', '#ff4757'],
    baseViewers: 6_400,
  },
];

const between = (a: number, b: number) => a + Math.random() * (b - a);

export const SAMPLE_STREAMS: LiveStream[] = SEEDS.map((s) => {
  const viewers = Math.round(s.baseViewers * between(0.85, 1.15));
  const signals = {
    viewers,
    viewerVelocity: between(-0.05, 0.18),
    chatVelocity: between(0.7, 1.6),
    sentiment: between(-0.1, 0.5),
    trendMatch: between(0.3, 0.75),
    platformPopularity: Math.min(1, Math.log10(Math.max(1, viewers)) / 5),
    anomalyScore: between(0.1, 0.4),
  };
  const score = scoreStream(signals);
  return {
    id: s.id,
    platform: s.platform,
    channel: s.channel,
    title: s.title,
    category: s.category,
    thumbnailUrl: gradient(s.thumb[0], s.thumb[1], s.channel),
    startedAt: Date.now() - Math.floor(between(15, 240)) * 60_000,
    signals,
    viralScore: score,
    reasons: explainStream(signals),
    viewerHistory: Array.from({ length: 30 }, (_, i) =>
      Math.round(viewers * between(0.92, 1.08) * (1 + i * 0.001)),
    ),
  };
});
