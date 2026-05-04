/**
 * Lightweight circuit breaker + exponential backoff retry helper.
 *
 * Why both? Retry handles transient errors (network blip, rate limit).
 * Circuit breaker handles sustained failure — after N consecutive failures
 * we stop hammering the upstream and fail fast for `cooldownMs` so the
 * upstream can recover and so we don't queue up doomed requests.
 */
import { log } from './logger.js';

export interface BreakerOptions {
  /** Failures in a row that trip the breaker. */
  failureThreshold: number;
  /** How long to stay tripped before allowing a probe request. */
  cooldownMs: number;
  /** Max retry attempts per call (transient retry, separate from breaker). */
  maxRetries: number;
  /** Base for exponential backoff (ms). 200 → 200, 400, 800, ... */
  baseDelayMs: number;
}

const DEFAULTS: BreakerOptions = {
  failureThreshold: 5,
  cooldownMs: 30_000,
  maxRetries: 3,
  baseDelayMs: 200,
};

type State = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: State = 'closed';
  private consecutiveFailures = 0;
  private openedAt = 0;
  private opts: BreakerOptions;

  constructor(public name: string, opts: Partial<BreakerOptions> = {}) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt < this.opts.cooldownMs) {
        throw new Error(`circuit-open:${this.name}`);
      }
      // Cooldown elapsed — allow a probe.
      this.state = 'half-open';
    }

    let attempt = 0;
    let lastErr: unknown;
    while (attempt <= this.opts.maxRetries) {
      try {
        const out = await fn();
        this.onSuccess();
        return out;
      } catch (err) {
        lastErr = err;
        attempt += 1;
        if (attempt > this.opts.maxRetries) break;
        const delay = this.opts.baseDelayMs * 2 ** (attempt - 1) + Math.random() * 50;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    this.onFailure();
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.state !== 'closed') {
      log.info(`[breaker:${this.name}] closed`);
      this.state = 'closed';
    }
  }

  private onFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.opts.failureThreshold && this.state !== 'open') {
      this.state = 'open';
      this.openedAt = Date.now();
      log.warn(`[breaker:${this.name}] tripped open`, {
        failures: this.consecutiveFailures,
        cooldownMs: this.opts.cooldownMs,
      });
    }
  }

  get status(): { state: State; consecutiveFailures: number } {
    return { state: this.state, consecutiveFailures: this.consecutiveFailures };
  }
}
