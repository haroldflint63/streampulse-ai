/**
 * Minimal in-memory cache with TTL. Used to cache TMDB / AI responses so we
 * don't pay external latency on every dashboard refresh.
 *
 * Why not Redis? Because the cache is per-process and read-mostly; the cost
 * of Redis round-trips defeats the purpose for sub-ms hot reads.
 */
interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class TtlCache<K, V> {
  private map = new Map<K, Entry<V>>();
  constructor(private defaultTtlMs: number) {}

  get(key: K): V | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: K, value: V, ttlMs?: number): void {
    this.map.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
  }

  async getOrLoad(key: K, loader: () => Promise<V>, ttlMs?: number): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const fresh = await loader();
    this.set(key, fresh, ttlMs);
    return fresh;
  }
}
