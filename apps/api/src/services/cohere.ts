import { CircuitBreaker } from '../util/circuitBreaker.js';
import { TtlCache } from '../util/cache.js';
import { log } from '../util/logger.js';

const breaker = new CircuitBreaker('cohere', { failureThreshold: 3, cooldownMs: 60_000 });
const cache = new TtlCache<string, number[]>(60 * 60_000); // 1h

/**
 * Cohere embeddings — used for similarity search ("because you watched X").
 * Falls back to a deterministic hash-based pseudo-embedding so callers can
 * always get *some* vector back. The fallback is good enough for unit tests
 * but obviously not for real recommendations.
 */
export async function embed(text: string): Promise<{ vector: number[]; source: 'cohere' | 'fallback' }> {
  const key = process.env.COHERE_API_KEY?.trim();
  if (!key) {
    return { vector: pseudoEmbed(text), source: 'fallback' };
  }
  const cached = cache.get(text);
  if (cached) return { vector: cached, source: 'cohere' };

  try {
    const vec = await breaker.run(async () => {
      const res = await fetch('https://api.cohere.com/v2/embed', {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${key}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'embed-english-v3.0',
          input_type: 'search_document',
          embedding_types: ['float'],
          texts: [text.slice(0, 2000)],
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) throw new Error(`cohere ${res.status}`);
      const json = (await res.json()) as { embeddings?: { float?: number[][] } };
      const v = json.embeddings?.float?.[0];
      if (!v) throw new Error('cohere: empty response');
      return v;
    });
    cache.set(text, vec);
    return { vector: vec, source: 'cohere' };
  } catch (err) {
    log.warn('cohere embed failed, using pseudo', { err: String(err) });
    return { vector: pseudoEmbed(text), source: 'fallback' };
  }
}

/** Cosine similarity for two equal-length vectors. */
export function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * 64-dim deterministic pseudo-embedding. Every word contributes to a fixed
 * bucket so similar word-sets land near each other. Good enough for fallback
 * "more like this" within the bundled catalog.
 */
function pseudoEmbed(text: string): number[] {
  const dims = 64;
  const v = new Array<number>(dims).fill(0);
  for (const tok of text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
    let h = 0;
    for (let i = 0; i < tok.length; i++) h = (h * 31 + tok.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % dims;
    v[idx] = (v[idx] ?? 0) + 1;
  }
  // L2 normalize
  const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / mag);
}
