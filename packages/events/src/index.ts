/**
 * EventBus — abstraction over Redis Streams with an in-memory fallback.
 *
 * Design notes:
 *  - Production wants Redis Streams for durability + at-least-once delivery
 *    + horizontal worker scaling via consumer groups.
 *  - Local dev / demo / first-time visitors must Just Work, so we ship a
 *    pub/sub-style in-memory implementation with the same surface area.
 *  - Producers don't need to know which backend is active. Consumers register
 *    a handler and the bus invokes it for every event.
 *
 * Tradeoff: the in-memory bus is single-process. If you scale the API
 * horizontally without REDIS_URL set, each instance has its own queue.
 * That's fine for the demo and acceptable for a single-node deployment.
 */
import type { WatchEvent } from '@streampulse/shared';
import { Redis } from 'ioredis';

const STREAM_KEY = 'streampulse:watch-events';
const GROUP = 'streampulse-workers';

export interface EventBus {
  readonly kind: 'redis' | 'memory';
  publish(event: WatchEvent): Promise<void>;
  subscribe(consumerId: string, handler: (e: WatchEvent) => Promise<void> | void): void;
  close(): Promise<void>;
}

class MemoryBus implements EventBus {
  readonly kind = 'memory' as const;
  private handlers: Array<(e: WatchEvent) => Promise<void> | void> = [];
  private closed = false;

  async publish(event: WatchEvent): Promise<void> {
    if (this.closed) return;
    // Fire-and-forget to mimic async delivery, but we still await each
    // handler so a slow handler can apply backpressure to subsequent events.
    for (const h of this.handlers) {
      try {
        await h(event);
      } catch (err) {
        // Bus must never crash the publisher; downstream is responsible
        // for its own retry policy.
        // eslint-disable-next-line no-console
        console.error('[memory-bus] handler error', err);
      }
    }
  }

  subscribe(_consumerId: string, handler: (e: WatchEvent) => Promise<void> | void): void {
    this.handlers.push(handler);
  }

  async close(): Promise<void> {
    this.closed = true;
    this.handlers = [];
  }
}

class RedisBus implements EventBus {
  readonly kind = 'redis' as const;
  private producer: Redis;
  private consumer: Redis | null = null;

  constructor(private url: string) {
    this.producer = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 3 });
  }

  async publish(event: WatchEvent): Promise<void> {
    // XADD with MAXLEN to bound memory. Approximate trimming (~) is O(1).
    await this.producer.xadd(
      STREAM_KEY,
      'MAXLEN',
      '~',
      '10000',
      '*',
      'data',
      JSON.stringify(event),
    );
  }

  subscribe(consumerId: string, handler: (e: WatchEvent) => Promise<void> | void): void {
    // Spin up a dedicated reader connection — XREADGROUP blocks, so we
    // don't want it to share the producer connection.
    if (!this.consumer) {
      this.consumer = new Redis(this.url, { lazyConnect: false, maxRetriesPerRequest: null });
    }
    void this.runConsumer(consumerId, handler).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[redis-bus] consumer crashed', err);
    });
  }

  private async runConsumer(
    consumerId: string,
    handler: (e: WatchEvent) => Promise<void> | void,
  ): Promise<void> {
    const conn = this.consumer!;
    // Idempotent group creation. NOGROUP error is expected on fresh streams.
    try {
      await conn.xgroup('CREATE', STREAM_KEY, GROUP, '$', 'MKSTREAM');
    } catch (e) {
      if (!String(e).includes('BUSYGROUP')) throw e;
    }

    while (true) {
      try {
        const res = await conn.xreadgroup(
          'GROUP',
          GROUP,
          consumerId,
          'COUNT',
          50,
          'BLOCK',
          5000,
          'STREAMS',
          STREAM_KEY,
          '>',
        );
        if (!res) continue;
        // ioredis return shape: [ [streamKey, [[id, [field, value, ...]], ...]] ]
        for (const [, entries] of res as Array<[string, Array<[string, string[]]>]>) {
          for (const [id, fields] of entries) {
            const dataIdx = fields.indexOf('data');
            if (dataIdx === -1) continue;
            const raw = fields[dataIdx + 1];
            if (!raw) continue;
            try {
              const evt = JSON.parse(raw) as WatchEvent;
              await handler(evt);
              await conn.xack(STREAM_KEY, GROUP, id);
            } catch (err) {
              // Leave the message un-acked so it's redelivered after the
              // pending-entries-list timeout. A real prod system would also
              // run XPENDING reaper + XCLAIM here.
              // eslint-disable-next-line no-console
              console.error('[redis-bus] handler error, message will be retried', err);
            }
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[redis-bus] read error, backing off 1s', err);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  async close(): Promise<void> {
    await this.producer.quit().catch(() => {});
    if (this.consumer) await this.consumer.quit().catch(() => {});
  }
}

/** Build the appropriate bus based on env. Logs the choice once at startup. */
export function createEventBus(redisUrl?: string | null): EventBus {
  if (redisUrl && redisUrl.trim().length > 0) {
    try {
      return new RedisBus(redisUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[events] failed to init Redis, falling back to memory', err);
    }
  }
  return new MemoryBus();
}
