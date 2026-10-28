/** Lets one key (a person) through `max` times in any `windowMs`. In memory: it resets when the server restarts. */
export function createRateLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return {
    take(key: string): { ok: true } | { ok: false; retryAfterMs: number } {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((h) => t - h < windowMs);
      if (recent.length >= max) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: Math.max(1, windowMs - (t - recent[0])) };
      }
      hits.set(key, [...recent, t]);
      return { ok: true };
    },
  };
}
