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
/** A failed read is retried soon, so one network blip doesn't hide GrowthBook for a whole minute. */
const FAILED_TTL_MS = 5_000;
const ATTEMPTS = 2;
let cache: { at: number; value: GbSnapshot | null } | undefined;

const reason = (error: unknown): string => {
  if (!(error instanceof Error)) return "unknown error";
  const cause = (error as Error & { cause?: { code?: string; message?: string } }).cause;
  return `${error.name}${cause?.code || cause?.message ? ` (${cause.code ?? cause.message})` : ""}`;
};

/** The flags and running experiments in GrowthBook, or null if it can't be reached. Cached for a minute. */
export async function getGrowthBook(): Promise<GbSnapshot | null> {
  if (cache && Date.now() - cache.at < (cache.value ? TTL_MS : FAILED_TTL_MS)) return cache.value;
  const { GROWTHBOOK_API_HOST, GROWTHBOOK_CLIENT_KEY } = getEnv();
  const url = `${GROWTHBOOK_API_HOST.replace(/\/+$/, "")}/api/features/${encodeURIComponent(GROWTHBOOK_CLIENT_KEY)}`;
  let value: GbSnapshot | null = null;
  for (let attempt = 1; attempt <= ATTEMPTS && !value; attempt++) {
    try {
      const res = await fetch(url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (res.ok) value = parseFeatures(await res.json());
      else {
        console.warn(`GrowthBook answered with status ${res.status}.`);
        break;
      }
    } catch (error) {
      // A network failure is usually a one-off: try once more, then carry on without GrowthBook.
      if (attempt === ATTEMPTS) console.warn("GrowthBook could not be reached:", reason(error));
    }
  }
  cache = { at: Date.now(), value };
  return value;
}
