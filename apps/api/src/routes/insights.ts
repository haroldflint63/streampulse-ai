import type { FastifyInstance } from 'fastify';
import { generateInsight } from '../services/groq.js';
import type { Aggregator } from '../services/aggregator.js';

export function registerInsightsRoute(app: FastifyInstance, agg: Aggregator): void {
  app.get('/insights', async () => {
    const snapshot = agg.snapshot();
    const insight = await generateInsight(snapshot);
    return { insight, metrics: snapshot };
  });

  app.get('/metrics', async () => agg.snapshot());

  app.get('/health', async () => ({ ok: true, ts: Date.now() }));
}
