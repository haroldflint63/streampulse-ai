import type { FastifyInstance } from 'fastify';
import type { WatchEvent, WatchEventKind } from '@streampulse/shared';

const VALID_KINDS: ReadonlySet<WatchEventKind> = new Set([
  'play',
  'pause',
  'seek',
  'stop',
  'progress',
]);

/** Minimal hand-rolled validator — keeps deps light, errors are explicit. */
function parseEvent(body: unknown): WatchEvent | string {
  if (typeof body !== 'object' || body === null) return 'body must be an object';
  const b = body as Record<string, unknown>;
  if (typeof b.userId !== 'string' || b.userId.length === 0) return 'userId required';
  if (typeof b.movieId !== 'string' || b.movieId.length === 0) return 'movieId required';
  if (typeof b.event !== 'string' || !VALID_KINDS.has(b.event as WatchEventKind))
    return `event must be one of ${[...VALID_KINDS].join(',')}`;
  const ts = typeof b.timestamp === 'number' ? b.timestamp : Date.now();
  const watch = typeof b.watchSeconds === 'number' && b.watchSeconds >= 0 ? b.watchSeconds : 0;
  return {
    userId: b.userId,
    movieId: b.movieId,
    event: b.event as WatchEventKind,
    timestamp: ts,
    watchSeconds: watch,
    eventId: typeof b.eventId === 'string' ? b.eventId : undefined,
  };
}

export function registerWatchEventsRoute(
  app: FastifyInstance,
  publish: (e: WatchEvent) => Promise<void>,
): void {
  app.post('/watch-event', async (req, reply) => {
    const parsed = parseEvent(req.body);
    if (typeof parsed === 'string') {
      reply.code(400);
      return { error: parsed };
    }
    // Publish to the bus (Redis or memory). Worker handles persistence + agg.
    await publish(parsed);
    return { accepted: true };
  });

  app.post('/watch-events/batch', async (req, reply) => {
    const body = req.body;
    if (!Array.isArray(body)) {
      reply.code(400);
      return { error: 'expected array' };
    }
    let accepted = 0;
    let rejected = 0;
    for (const item of body) {
      const parsed = parseEvent(item);
      if (typeof parsed === 'string') {
        rejected += 1;
      } else {
        await publish(parsed);
        accepted += 1;
      }
    }
    return { accepted, rejected };
  });
}
