import { connection } from "next/server";
import { answerQuestion, MESSAGES } from "@/lib/ask/ask";
import { groqDeps } from "@/lib/ask/groq";
import { createRateLimiter } from "@/lib/ask/rate-limit";
import { getEnv } from "@/lib/env";
import { Prisma } from "@/generated/store/client";
import { runQuery } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { localDay } from "@/lib/tz";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BODY = 2000;
export const QUESTION_MAX = 300;
const limiter = createRateLimiter(10, 60_000);

const fail = (status: number, kind: string, message: string, extra: Record<string, unknown> = {}) =>
  Response.json({ ok: false, kind, message, ...extra }, { status, headers: { ...NO_STORE, ...(extra.retryAfter ? { "Retry-After": String(extra.retryAfter) } : {}) } });

/** Ask a question in plain English. 401 signed out, 400 bad question, 429 too many, 503 switched off or AI busy. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail(401, "signed-out", "Not signed in.");
  const env = getEnv();
  if (env.AI_PROVIDER === "none") return fail(503, "off", "Ask your data is switched off");

  const raw = await request.text().catch(() => "");
  let question = "";
  try {
    const body: unknown = raw.length <= MAX_BODY ? JSON.parse(raw) : null;
    question = typeof (body as { question?: unknown } | null)?.question === "string" ? (body as { question: string }).question.trim() : "";
  } catch {
    question = "";
  }
  if (question.length < 1 || question.length > QUESTION_MAX) return fail(400, "invalid", `Ask a question of 1 to ${QUESTION_MAX} characters.`);

  const turn = limiter.take(user.email);
  if (!turn.ok) {
    const retryAfter = Math.ceil(turn.retryAfterMs / 1000);
    return fail(429, "rate", "You’re asking too fast. Try again in a minute.", { retryAfter });
  }

  await connection();
  const ai = groqDeps();
  const result = await answerQuestion(question, { today: localDay(new Date(), env.INSIGHTS_TIMEZONE), timeZone: env.INSIGHTS_TIMEZONE }, {
    ...ai,
    runSql: async (sql) => {
      // The one place a query is not written out in full in the code: checkSql() has already made sure it is a single
      // SELECT or WITH on the eight allowed tables, and it runs read-only with the 15-second limit.
      const rows = await runQuery((tx) => tx.$queryRaw<Record<string, unknown>[]>`${Prisma.raw(sql)}`);
      return { columns: rows[0] ? Object.keys(rows[0]) : [], rows };
    },
  });

  if (result.kind === "answer") return Response.json({ ok: true, answer: result.answer }, { headers: NO_STORE });
  if (result.kind === "refused") return fail(200, "refused", MESSAGES.refused);
  if (result.kind === "busy") return fail(503, "busy", MESSAGES.busy);
  return fail(502, "failed", MESSAGES.failed);
}
