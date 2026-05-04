import { NextResponse } from 'next/server';
import type { AggregateMetrics, Insight } from '@streampulse/shared';

/**
 * Server-side insight endpoint. Calls Groq when GROQ_API_KEY is set,
 * otherwise returns a deterministic rule-based summary so the dashboard
 * always has *something* to show. Same-origin call from the browser, so
 * the API key never leaves the server.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let metrics: AggregateMetrics;
  try {
    metrics = (await req.json()) as AggregateMetrics;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const key = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.1-8b-instant';

  if (!key) {
    return NextResponse.json(fallbackInsight(metrics));
  }

  const prompt = buildPrompt(metrics);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 220,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an analytics assistant for a streaming platform. Respond with strict JSON: {"insight": "...", "recommendation": "..."}. Each field 1 sentence, plain English, actionable, no marketing fluff.',
          },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(7_000),
    });
    if (!res.ok) throw new Error(`groq ${res.status}`);
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(content) as { insight?: string; recommendation?: string };
    const insight: Insight = {
      insight: parsed.insight ?? 'No insight available.',
      recommendation: parsed.recommendation ?? 'Continue monitoring.',
      source: 'groq',
      generatedAt: Date.now(),
    };
    return NextResponse.json(insight, {
      headers: { 'cache-control': 'no-store' },
    });
  } catch {
    return NextResponse.json(fallbackInsight(metrics));
  }
}

function buildPrompt(m: AggregateMetrics): string {
  const top =
    m.topMovies
      .slice(0, 3)
      .map((t) => `${t.title} (${t.activeViewers} viewers)`)
      .join(', ') || 'none';
  const drops =
    m.dropOffAlerts
      .slice(0, 3)
      .map((d) => `${d.title} ${(d.dropOffRate * 100).toFixed(0)}%`)
      .join(', ') || 'none';
  return `Current platform state — ${m.activeUsers} active users, ${m.eventsPerSecond.toFixed(
    1,
  )} events/s, total watch ${(m.totalWatchSeconds / 60).toFixed(
    0,
  )}m. Top: ${top}. Drop-off alerts: ${drops}.`;
}

function fallbackInsight(m: AggregateMetrics): Insight {
  let insight = `${m.activeUsers} users active across ${m.topMovies.length} titles.`;
  let recommendation = 'Watch volume is steady — no action required.';

  if (m.dropOffAlerts.length > 0) {
    const worst = m.dropOffAlerts[0]!;
    insight = `${(worst.dropOffRate * 100).toFixed(0)}% of viewers drop "${worst.title}" before the 30% mark.`;
    recommendation =
      'Surface a shorter alternative or trim the cold-open in the player thumbnail.';
  } else if (m.eventsPerSecond > 50) {
    insight = `Heavy traffic: ${m.eventsPerSecond.toFixed(
      1,
    )} events/sec. Top title: ${m.topMovies[0]?.title ?? 'n/a'}.`;
    recommendation =
      'Pre-warm CDN edge caches for the top three titles before the next ingest spike.';
  } else if (m.activeUsers === 0) {
    insight = 'No active sessions. Demo simulator is idle or no clients are connected.';
    recommendation = 'Toggle demo mode or check the WebSocket gateway logs.';
  }

  return { insight, recommendation, source: 'fallback', generatedAt: Date.now() };
}
