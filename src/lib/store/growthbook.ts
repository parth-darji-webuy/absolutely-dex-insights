import "server-only";
import { getEnv } from "../env";

// GrowthBook, read only. This file can only send one GET request, to the public features endpoint
// that the SDK client key opens. No secret or admin key is used, and there is no code path that writes.

export type GbExperiment = { key: string; flag: string; values: string[]; names: (string | undefined)[]; name?: string };
export type GbSnapshot = { flags: string[]; experiments: GbExperiment[] };

type Rule = { key?: unknown; variations?: unknown; meta?: unknown; name?: unknown };
type Payload = { features?: Record<string, { rules?: Rule[] }> };

/** Reads the experiments and flags out of GrowthBook's features payload. Anything that isn't shaped as expected is skipped. */
export function parseFeatures(payload: unknown): GbSnapshot {
  const features = (payload as Payload | null)?.features;
  if (!features || typeof features !== "object") return { flags: [], experiments: [] };
  const experiments: GbExperiment[] = [];
  for (const [flag, feature] of Object.entries(features)) {
    for (const rule of Array.isArray(feature?.rules) ? feature.rules : []) {
      if (typeof rule?.key !== "string" || !Array.isArray(rule.variations)) continue;
      const meta = Array.isArray(rule.meta) ? (rule.meta as { name?: unknown }[]) : [];
      experiments.push({
        key: rule.key,
        flag,
        values: rule.variations.map((v) => JSON.stringify(v)),
        names: rule.variations.map((_, i) => (typeof meta[i]?.name === "string" ? (meta[i].name as string) : undefined)),
        name: typeof rule.name === "string" ? rule.name : undefined,
      });
    }
  }
  return { flags: Object.keys(features), experiments };
}

const TTL_MS = 60_000;
let cache: { at: number; value: GbSnapshot | null } | undefined;

/** The flags and running experiments in GrowthBook, or null if it can't be reached. Cached for a minute. */
export async function getGrowthBook(): Promise<GbSnapshot | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const { GROWTHBOOK_API_HOST, GROWTHBOOK_CLIENT_KEY } = getEnv();
  let value: GbSnapshot | null = null;
  try {
    const res = await fetch(`${GROWTHBOOK_API_HOST.replace(/\/+$/, "")}/api/features/${encodeURIComponent(GROWTHBOOK_CLIENT_KEY)}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) value = parseFeatures(await res.json());
    else console.error(`GrowthBook answered with status ${res.status}.`);
  } catch (error) {
    console.error("GrowthBook could not be reached:", error instanceof Error ? error.name : "unknown error");
  }
  cache = { at: Date.now(), value };
  return value;
}
