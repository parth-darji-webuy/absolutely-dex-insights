import "server-only";
import { z } from "zod";
import { parseYMD } from "./dates";

/** One environment problem, named by variable. Never carries the value. */
export class EnvError extends Error {
  constructor(readonly problems: { name: string; reason: string }[]) {
    super(`Environment problem: ${problems.map((p) => `${p.name} (${p.reason})`).join(", ")}. Fix .env (see .env.example) and restart.`);
    this.name = "EnvError";
  }
}

// An empty value in .env counts as missing.
const text = z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string({ error: "missing" }));
const postgresUrl = text.refine((v) => /^postgres(ql)?:\/\/\S+$/.test(v), "must be a postgres:// URL");

const validTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const optional = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const schema = z
  .object({
    STORE_DATABASE_URL: postgresUrl,
    STORE_DATABASE_URL_UNPOOLED: postgresUrl,
    SESSION_SECRET: text.refine((v) => v.length >= 32, "must be at least 32 characters"),
    ADMIN_PASSWORD: text.refine((v) => v.length >= 12, "must be at least 12 characters"),
    GROWTHBOOK_API_HOST: text.refine((v) => /^https?:\/\/\S+$/.test(v), "must be a URL starting with http:// or https://"),
    GROWTHBOOK_CLIENT_KEY: text.refine((v) => /^\S+$/.test(v), "must not contain spaces"),
    AI_PROVIDER: z.enum(["groq", "none"], { error: "must be groq or none" }),
    GROQ_API_KEY: optional(z.string()),
    GROQ_MODEL: optional(z.string()),
    INSIGHTS_TIMEZONE: text.refine(validTimeZone, "must be a real time zone, like Europe/London"),
    TRACKING_START: text.refine((v) => parseYMD(v) !== null, "must be a real date, like 2026-09-01"),
    STORE_REFRESH_MINUTES: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v) : v),
      z.number({ error: "must be a whole number from 5 to 120" }).int("must be a whole number from 5 to 120").min(5, "must be at least 5").max(120, "must be at most 120"),
    ),
  })
  .superRefine((e, ctx) => {
    if (e.AI_PROVIDER !== "groq") return;
    for (const name of ["GROQ_API_KEY", "GROQ_MODEL"] as const) {
      if (!e[name]) ctx.addIssue({ code: "custom", path: [name], message: "needed when AI_PROVIDER is groq" });
    }
  });

export type Env = z.infer<typeof schema>;

/** Checks a set of variables. Throws EnvError listing every bad variable by name, never by value. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (result.success) return result.data;
  const seen = new Set<string>();
  const problems = result.error.issues.flatMap((i) => {
    const name = String(i.path[0] ?? "environment");
    if (seen.has(name)) return [];
    seen.add(name);
    return [{ name, reason: i.message.replace(/^Invalid input: /, "") }];
  });
  throw new EnvError(problems);
}

let cached: Env | undefined;

/** The checked environment. Checked once, on first use (the app also checks it at start-up). */
export function getEnv(): Env {
  return (cached ??= parseEnv(process.env));
}
