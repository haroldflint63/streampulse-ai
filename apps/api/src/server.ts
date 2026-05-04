import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createEventBus } from '@streampulse/events';
import type { WatchEvent } from '@streampulse/shared';

import { Aggregator } from './services/aggregator.js';
import { fetchMovies } from './services/tmdb.js';
import { generateInsight } from './services/groq.js';
import { initSupabase, persistWatchEvent } from './db/supabase.js';
import { registerWatchEventsRoute } from './routes/watchEvents.js';
import { registerMoviesRoute } from './routes/movies.js';
import { registerInsightsRoute } from './routes/insights.js';
import { WsGateway } from './ws/gateway.js';
import { Simulator } from './demo/simulator.js';
import { log } from './util/logger.js';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? '*';
const DEMO_MODE = (process.env.DEMO_MODE ?? 'true').toLowerCase() === 'true';
const DEMO_USERS = Number(process.env.DEMO_USERS ?? 120);
const DEMO_HZ = Number(process.env.DEMO_EVENT_RATE_HZ ?? 8);

async function main(): Promise<void> {
  initSupabase();
  const bus = createEventBus(process.env.REDIS_URL || null);
  log.info('[boot] event bus', { kind: bus.kind });

  // Pre-fetch catalog so the aggregator can resolve titles immediately.
  const catalog = await fetchMovies();
  const agg = new Aggregator(() => catalog);

  // ── Fastify HTTP ──────────────────────────────────────────────────────
  const app = Fastify({ logger: false, trustProxy: true });
  await app.register(cors, {
    // CSV of allowed origins, or '*' for the demo.
    origin: WEB_ORIGIN === '*' ? true : WEB_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  });

  registerWatchEventsRoute(app, async (e) => bus.publish(e));
  registerMoviesRoute(app);
  registerInsightsRoute(app, agg);

  // ── Worker: consume bus → persist + aggregate + broadcast ─────────────
  const ws = new WsGateway(app.server, { path: '/ws', demoMode: DEMO_MODE });

  bus.subscribe('aggregator-1', async (evt: WatchEvent) => {
    const fresh = agg.ingest(evt);
    if (!fresh) return; // duplicate
    // Persist async — don't block the worker.
    void persistWatchEvent(evt);
    // Stream individual events for the live activity feed.
    ws.broadcast({ type: 'event', data: evt });
  });

  // Periodic broadcast of aggregate metrics + insights.
  setInterval(() => {
    const snap = agg.snapshot();
    ws.broadcast({ type: 'metrics', data: snap });
    for (const a of snap.dropOffAlerts) {
      ws.broadcast({ type: 'alert', data: a });
    }
  }, 1500);

  // Insights are slower (LLM-bound) — run on a separate, slower cadence.
  setInterval(async () => {
    try {
      const snap = agg.snapshot();
      const insight = await generateInsight(snap);
      ws.broadcast({ type: 'insight', data: insight });
    } catch (err) {
      log.warn('insight loop error', { err: String(err) });
    }
  }, 12_000);

  // ── Demo simulator ────────────────────────────────────────────────────
  if (DEMO_MODE) {
    const sim = new Simulator(
      { users: DEMO_USERS, eventRateHz: DEMO_HZ },
      (e) => void bus.publish(e),
    );
    await sim.start();
  }

  // ── Listen ────────────────────────────────────────────────────────────
  await app.listen({ port: PORT, host: HOST });
  log.info(`[boot] StreamPulse API listening`, {
    url: `http://${HOST}:${PORT}`,
    ws: `ws://${HOST}:${PORT}/ws`,
    demo: DEMO_MODE,
  });

  // Graceful shutdown.
  for (const sig of ['SIGTERM', 'SIGINT'] as const) {
    process.on(sig, async () => {
      log.info(`[shutdown] received ${sig}`);
      await app.close().catch(() => {});
      await bus.close().catch(() => {});
      process.exit(0);
    });
  }
}

main().catch((err) => {
  log.error('[boot] fatal', { err: String(err) });
  process.exit(1);
});
