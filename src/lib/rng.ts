/** Small seeded generator (LCG): the same seed always gives the same sequence. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** Turns any string into a stable seed. */
export const seedOf = (str: string): number =>
  [...String(str)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export const sum = (a: number[]): number => a.reduce((x, y) => x + y, 0);
