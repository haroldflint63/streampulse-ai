/**
 * Viral simulator — drives the Live Demo Mode.  Owns the in-memory state
 * for the dashboard: viewer histories, signal evolution, and the headline
 * "spike" event that demonstrates anomaly detection in action.
 *
 * Architecturally this stands in for the backend pipeline:
 *   ingest events → score worker → ranking engine → ws broadcast.
 * The same outputs the dashboard consumes here would be produced by a
 * Fastify + Redis Streams + ws fan-out service in production.
 */
import type {
  LiveStream,
  ViralAlert,
  ViralSignals,
  ViralSnapshot,
} from '@streampulse/shared';
import { explainStream, rankStreams, scoreStream } from './viralEngine';
import { SAMPLE_STREAMS } from './sampleStreams';

interface Listeners {
  onSnapshot?: (s: ViralSnapshot) => void;
  onAlert?: (a: ViralAlert) => void;
  onSpike?: (streamId: string) => void;
}

export class ViralSimulator {
  private streams: LiveStream[];
  private timer: ReturnType<typeof setInterval> | null = null;
  private totalEvents = 0;
  private recentEventTs: number[] = [];
  private spikingId: string | null = null;
  private spikeStartedAt = 0;
  private alerted = new Set<string>();

  constructor(private listeners: Listeners) {
    this.streams = SAMPLE_STREAMS.map((s) => ({
      ...s,
      signals: { ...s.signals },
      viewerHistory: [...s.viewerHistory],
      reasons: [...s.reasons],
    }));
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 1_000);
    this.tick();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Manually trigger a viral spike on a random eligible stream. */
  triggerSpike(): string {
    const pool = this.streams.filter((s) => s.id !== this.spikingId);
    const target = pool[Math.floor(Math.random() * pool.length)] ?? this.streams[0]!;
    this.spikingId = target.id;
    this.spikeStartedAt = Date.now();
    this.listeners.onSpike?.(target.id);
    return target.id;
  }

  snapshot(): ViralSnapshot {
    return {
      streams: rankStreams(this.streams),
      alerts: [],
      serverTime: Date.now(),
      totalEvents: this.totalEvents,
      eventsPerSecond: this.eps(),
    };
  }

  private eps(): number {
    const cutoff = Date.now() - 5_000;
    while (this.recentEventTs.length && (this.recentEventTs[0] ?? 0) < cutoff) {
      this.recentEventTs.shift();
    }
    return this.recentEventTs.length / 5;
  }

  private tick(): void {
    const now = Date.now();
    for (const s of this.streams) {
      this.evolve(s, now);
    }
    // Auto-cool a spike after ~25s so the demo loops nicely.
    if (this.spikingId && now - this.spikeStartedAt > 25_000) {
      this.spikingId = null;
    }
    const snap = this.snapshot();
    this.listeners.onSnapshot?.(snap);

    // Fire alerts for any newly-hot stream (>=80) we haven't alerted on.
    for (const s of snap.streams) {
      if (s.viralScore >= 80 && !this.alerted.has(s.id)) {
        this.alerted.add(s.id);
        const alert: ViralAlert = {
          streamId: s.id,
          channel: s.channel,
          title: s.title,
          viralScore: s.viralScore,
          kind: s.signals.anomalyScore >= 0.7 ? 'spike' : 'rising',
          timestamp: now,
        };
        this.listeners.onAlert?.(alert);
      }
      if (s.viralScore < 65) this.alerted.delete(s.id);
    }
  }

  private evolve(s: LiveStream, now: number): void {
    const isSpiking = this.spikingId === s.id;
    const elapsed = isSpiking ? (now - this.spikeStartedAt) / 1000 : 0;

    // Drift base signals.
    const sig: ViralSignals = { ...s.signals };
    sig.viewerVelocity = drift(sig.viewerVelocity, -0.05, 0.2, 0.02);
    sig.chatVelocity = drift(sig.chatVelocity, 0.6, 1.8, 0.05);
    sig.sentiment = drift(sig.sentiment, -0.2, 0.6, 0.04);
    sig.trendMatch = drift(sig.trendMatch, 0.25, 0.85, 0.02);
    sig.anomalyScore = drift(sig.anomalyScore, 0.05, 0.5, 0.05);

    if (isSpiking) {
      // Ramp up sharply for first 8s, plateau, then start cooling.
      const ramp = Math.min(1, elapsed / 8);
      const cool = Math.max(0, 1 - Math.max(0, elapsed - 16) / 9);
      const intensity = ramp * cool;
      sig.viewerVelocity = Math.max(sig.viewerVelocity, 0.25 + 0.5 * intensity);
      sig.chatVelocity = Math.max(sig.chatVelocity, 1.6 + 2.0 * intensity);
      sig.sentiment = Math.max(sig.sentiment, 0.4 + 0.4 * intensity);
      sig.anomalyScore = Math.max(sig.anomalyScore, 0.7 + 0.3 * intensity);
      sig.trendMatch = Math.max(sig.trendMatch, 0.7 + 0.25 * intensity);
    }

    // Update viewers based on velocity.
    const lastViewers = s.viewerHistory[s.viewerHistory.length - 1] ?? sig.viewers;
    const next = Math.max(
      100,
      Math.round(lastViewers * (1 + sig.viewerVelocity / 60) * (0.99 + Math.random() * 0.02)),
    );
    sig.viewers = next;
    s.viewerHistory.push(next);
    while (s.viewerHistory.length > 60) s.viewerHistory.shift();

    s.signals = sig;
    s.viralScore = scoreStream(sig);
    s.reasons = explainStream(sig);

    // Count the per-tick scoring as an event for the EPS gauge.
    this.totalEvents += 1;
    this.recentEventTs.push(now);
  }
}

function drift(x: number, lo: number, hi: number, step: number): number {
  const next = x + (Math.random() - 0.5) * step * 2;
  return Math.max(lo, Math.min(hi, next));
}
