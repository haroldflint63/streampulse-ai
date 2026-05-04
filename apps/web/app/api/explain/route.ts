import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ViralExplanation } from '@streampulse/shared';

/**
 * /api/explain — server-side LLM narrative for "why this stream is trending".
 * Same trick as /api/insight: GROQ_API_KEY lives only on the server, the
 * browser hits a same-origin route, we return strict JSON the UI can render.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SignalsSchema = z.object({
  viewers: z.number(),
  viewerVelocity: z.number(),
  chatVelocity: z.number(),
  sentiment: z.number(),
  trendMatch: z.number(),
  platformPopularity: z.number(),
  anomalyScore: z.number(),
});

const Body = z.object({
  id: z.string(),
  channel: z.string(),
  title: z.string(),
  category: z.string(),
  platform: z.string(),
  viralScore: z.number(),
  signals: SignalsSchema,
  reasons: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const key = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.1-8b-instant';
  const heuristic = fallbackExplain(parsed);
  if (!key) return NextResponse.json(heuristic);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: 280,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a senior live-ops analyst at a streaming platform like Twitch. Given a stream and its real-time signals, return STRICT JSON: {"narrative": "1-2 sentence plain-English explanation of why this stream is having a viral moment", "bullets": ["3-4 short, punchy bullets citing the strongest signals"], "confidence": number between 0 and 1}. No marketing fluff. Cite specific numbers from the signals when relevant.',
          },
          { role: 'user', content: buildPrompt(parsed) },
        ],
      }),
      signal: AbortSignal.timeout(7_000),
    });
    if (!res.ok) throw new Error(`groq ${res.status}`);
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? '';
    const out = JSON.parse(content) as {
      narrative?: string;
      bullets?: string[];
      confidence?: number;
    };
    const explanation: ViralExplanation = {
      streamId: parsed.id,
      narrative: out.narrative?.trim() || heuristic.narrative,
      bullets: Array.isArray(out.bullets) && out.bullets.length > 0 ? out.bullets.slice(0, 5) : heuristic.bullets,
      confidence: typeof out.confidence === 'number' ? Math.max(0, Math.min(1, out.confidence)) : heuristic.confidence,
      source: 'groq',
      generatedAt: Date.now(),
    };
    return NextResponse.json(explanation);
  } catch {
    return NextResponse.json(heuristic);
  }
}

function buildPrompt(s: z.infer<typeof Body>): string {
  const sg = s.signals;
  return [
    `Stream: ${s.channel} on ${s.platform} — "${s.title}" (${s.category})`,
    `Viral score: ${s.viralScore}/100`,
    `Signals:`,
    `  viewers: ${sg.viewers.toLocaleString()}`,
    `  viewerVelocity (10m): ${(sg.viewerVelocity * 100).toFixed(1)}%`,
    `  chatVelocity (× normal): ${sg.chatVelocity.toFixed(2)}`,
    `  sentiment (-1..1): ${sg.sentiment.toFixed(2)}`,
    `  trendMatch (0..1): ${sg.trendMatch.toFixed(2)}`,
    `  platformPopularity (0..1): ${sg.platformPopularity.toFixed(2)}`,
    `  anomalyScore (0..1): ${sg.anomalyScore.toFixed(2)}`,
    s.reasons.length ? `Heuristic flags: ${s.reasons.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function fallbackExplain(s: z.infer<typeof Body>): ViralExplanation {
  const bullets: string[] = [];
  if (s.signals.viewerVelocity >= 0.15)
    bullets.push(`Viewers up ${Math.round(s.signals.viewerVelocity * 100)}% in 10 min`);
  if (s.signals.chatVelocity >= 1.5)
    bullets.push(`Chat velocity ${s.signals.chatVelocity.toFixed(1)}× channel baseline`);
  if (s.signals.anomalyScore >= 0.7)
    bullets.push(`Anomaly detector at ${Math.round(s.signals.anomalyScore * 100)}%`);
  if (s.signals.sentiment >= 0.4) bullets.push('Sentiment spike: excitement');
  if (s.signals.trendMatch >= 0.65) bullets.push('Title matches a trending category');
  if (bullets.length === 0) bullets.push('Steady — no breakout signals yet');

  const narrative =
    s.viralScore >= 80
      ? `${s.channel} is having a viral moment: multiple signals are firing simultaneously, with anomaly detection flagging the spike as statistically unusual versus the channel's baseline.`
      : s.viralScore >= 65
      ? `${s.channel} is climbing fast — viewer velocity and chat engagement are pulling well above normal for this category.`
      : `${s.channel} is steady. Signals are within normal range; no breakout pattern detected.`;

  return {
    streamId: s.id,
    narrative,
    bullets,
    confidence: Math.max(0, Math.min(1, s.viralScore / 100)),
    source: 'fallback',
    generatedAt: Date.now(),
  };
}
