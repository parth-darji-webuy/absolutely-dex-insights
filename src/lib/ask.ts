import type { Answer } from "@/types";

export type AnswerSet = { topYesterday: Answer; buyNow: Answer; dropoff: Answer; sizes: Answer };

/** Picks the sample answer a question is closest to, or null when it matches none. Order matters. */
export function matchAnswer(question: string, answers: AnswerSet): Answer | null {
  const s = question.toLowerCase();
  if (/buy now|test|experiment|variant|winning/.test(s)) return answers.buyNow;
  if (/drop|funnel|quick view/.test(s)) return answers.dropoff;
  if (/categor|size|sell/.test(s)) return answers.sizes;
  if (/product|add.?to.?cart|most|best/.test(s)) return answers.topYesterday;
  return null;
}
