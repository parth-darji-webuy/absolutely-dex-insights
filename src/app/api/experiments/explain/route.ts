import { connection } from "next/server";
import { aiExplainExperiment } from "@/lib/ask/experiment-explain";
import { createRateLimiter } from "@/lib/ask/rate-limit";
import { getExperiment } from "@/lib/data";
import { getEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BODY = 500;
const limiter = createRateLimiter(20, 60_000);
const fail = (status: number, message: string) => Response.json({ ok: false, message }, { status, headers: NO_STORE });

/** The AI's explanation of one experiment. 401 signed out, 400 bad key, 404 unknown, 429 too many, 503 AI off or unavailable. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "Not signed in.");
  if (getEnv().AI_PROVIDER === "none") return fail(503, "AI is switched off.");

  const raw = await request.text().catch(() => "");
  let key = "";
  try {
    const body: unknown = raw.length <= MAX_BODY ? JSON.parse(raw) : null;
    key = typeof (body as { key?: unknown } | null)?.key === "string" ? (body as { key: string }).key.trim() : "";
  } catch {
    key = "";
  }
  if (!key || key.length > 80) return fail(400, "Say which experiment.");
  if (!limiter.take(user.email).ok) return fail(429, "Too many requests. Try again in a minute.");

  await connection();
  try {
    const exp = await getExperiment(key);
    if (!exp) return fail(404, "That experiment doesn’t exist.");
    const paragraphs = await aiExplainExperiment(exp);
    if (!paragraphs) return fail(503, "The AI couldn’t explain this one.");
    return Response.json({ ok: true, paragraphs }, { headers: NO_STORE });
  } catch (error) {
    console.error("Explain failed:", error instanceof Error ? error.name : "unknown error");
    return fail(500, "Couldn’t explain this experiment.");
  }
}
