"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import type { Answer } from "@/types";
import { AnswerCard, type AskBody, type AskItem } from "./AnswerCard";

export const QUESTION_MAX = 300;

type Reply = { ok: true; answer: Answer } | { ok: false; kind: string; message: string };

type Props = { suggestions: string[]; initialQuestion?: string };

/** What a reply that is not an answer looks like on the page. */
function noticeFor(kind: string, message: string): Extract<AskBody, { state: "notice" }> {
  if (kind === "refused") return { state: "notice", title: message, tables: true };
  if (kind === "busy") return { state: "notice", title: message, detail: "Nothing was lost. Ask again in a minute." };
  if (kind === "rate") return { state: "notice", title: message, detail: "You can ask up to 10 questions a minute." };
  if (kind === "off") return { state: "notice", title: message };
  return { state: "notice", title: message || "Something went wrong. Try again.", detail: "Try asking in a different way." };
}

/** The question box, the suggestion chips and the answers, newest first. */
export function AskPanel({ suggestions, initialQuestion }: Props) {
  const router = useRouter();
  const nextId = useRef(0);
  const [items, setItems] = useState<AskItem[]>([]);
  const [text, setText] = useState("");

  const ask = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      const id = ++nextId.current;
      const put = (item: AskBody) => setItems((l) => l.map((it) => (it.id === id ? ({ id, q, ...item } as AskItem) : it)));
      if (q.length > QUESTION_MAX) {
        setItems((l) => [{ id, q: `${q.slice(0, 60)}…`, state: "notice", title: `Questions can be up to ${QUESTION_MAX} characters.` }, ...l]);
        return;
      }
      setItems((l) => [{ id, q, state: "thinking" }, ...l]);
      try {
        const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
        if (res.status === 401) {
          router.push("/sign-in");
          return;
        }
        const reply = (await res.json().catch(() => null)) as Reply | null;
        if (reply?.ok) put({ state: "answer", answer: reply.answer, fresh: true });
        else put(noticeFor(reply?.kind ?? "failed", reply?.message ?? "Something went wrong. Try again."));
      } catch {
        put(noticeFor("busy", "The AI is busy, try again in a minute"));
      }
    },
    [router],
  );

  // A question typed in ⌘K arrives as ?q=…; ask it once, then tidy the address.
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!initialQuestion) {
      handled.current = null;
      return;
    }
    if (handled.current === initialQuestion) return;
    handled.current = initialQuestion;
    void ask(initialQuestion);
    router.replace("/ask", { scroll: false });
  }, [initialQuestion, ask, router]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(text);
    setText("");
  };

  return (
    <>
      <section className="ask-hero fade rounded-lg border border-border shadow-[0_1px_2px_rgba(16,24,40,.04)]">
        <div>
          <h2 className="text-lg font-semibold tracking-[-.015em]">Ask your data</h2>
          <p className="mt-0.5 text-text2">Plain-English answers from your events.</p>
        </div>
        <form className="ask-input" onSubmit={submit}>
          <Icon name="spark" />
          <input
            name="q"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={QUESTION_MAX + 1}
            placeholder="Ask about your data, e.g. Which product had the most add-to-carts yesterday?"
            autoComplete="off"
            aria-label="Ask about your data"
          />
          <Button variant="primary" size="sm" type="submit">
            Ask <Icon name="arrow" size="sm" />
          </Button>
        </form>
        <div className="sugs">
          {suggestions.map((s) => (
            <Chip key={s} onClick={() => void ask(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </section>
      {items.map((it, i) => (
        <AnswerCard key={it.id} item={it} index={i} />
      ))}
    </>
  );
}
