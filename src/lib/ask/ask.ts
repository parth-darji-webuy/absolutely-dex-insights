import type { Answer } from "@/types";
import { answerParts, type Row, rowsForAi } from "./format";
import { checkSql } from "./sql-check";

export type AskContext = { today: string; timeZone: string };

/** What the orchestrator needs from outside, so it can be tested without the AI or the database. */
export type AskDeps = {
  /** Asks the AI for one SQL query, or the word REFUSE. Throws when the AI is busy or fails. */
  writeSql(question: string, ctx: AskContext): Promise<string>;
  /** Runs a checked query read-only. */
  runSql(sql: string): Promise<{ columns: string[]; rows: Row[] }>;
  /** Asks the AI for a short answer from the rows. Throws when the AI is busy or fails. */
  summarize(question: string, sql: string, columns: string[], rows: ReturnType<typeof rowsForAi>, total: number): Promise<string>;
};

export type AskResult =
  | { kind: "answer"; answer: Answer }
  | { kind: "refused" }
  | { kind: "busy" }
  | { kind: "failed" };

export const MESSAGES = {
  refused: "I can only answer questions about the tracked data",
  busy: "The AI is busy, try again in a minute",
  failed: "I couldn’t run that query. Try asking in a different way.",
} as const;

/** The SQL out of the AI's reply: the text itself, or what is inside a ``` fence. */
export function extractSql(reply: string): string {
  const fenced = /```(?:sql)?\s*([\s\S]*?)```/i.exec(reply);
  return (fenced ? fenced[1] : reply).trim();
}

/** Question in, answer out: the AI writes a query, the server checks and runs it, the AI explains the rows. */
export async function answerQuestion(question: string, ctx: AskContext, deps: AskDeps): Promise<AskResult> {
  let reply: string;
  try {
    reply = await deps.writeSql(question, ctx);
  } catch {
    return { kind: "busy" };
  }
  const draft = extractSql(reply);
  if (!draft || /^refuse\b/i.test(draft)) return { kind: "refused" };

  const checked = checkSql(draft);
  if (!checked.ok) return { kind: "refused" };

  let result: { columns: string[]; rows: Row[] };
  try {
    result = await deps.runSql(checked.sql);
  } catch {
    return { kind: "failed" };
  }

  const { columns, rows } = result;
  let text: string;
  if (rows.length === 0) {
    text = "I ran the query and no rows matched, so there is nothing to report for that question.";
  } else {
    try {
      text = (await deps.summarize(question, checked.sql, columns, rowsForAi(columns, rows), rows.length)).trim();
    } catch {
      return { kind: "busy" };
    }
    if (!text) return { kind: "busy" };
  }
  return { kind: "answer", answer: { q: question, a: text, sql: checked.sql, ...answerParts(columns, rows) } };
}
