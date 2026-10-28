"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { matchAnswer, type AnswerSet } from "@/lib/ask";
import { AnswerCard, type AskItem } from "./AnswerCard";

const THINK_MS = 1100;

type Props = { answers: AnswerSet; suggestions: string[]; initialQuestion?: string; startWith?: (keyof AnswerSet)[] };

/** The question box, the suggestion chips and the answers, newest first. */
export function AskPanel({ answers, suggestions, initialQuestion, startWith = [] }: Props) {
  const router = useRouter();
  const nextId = useRef(startWith.length);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [items, setItems] = useState<AskItem[]>(() =>
    startWith.map((k, i) => ({ id: i, q: answers[k].q, state: "answer", answer: answers[k], fresh: false })),
  );
  const [text, setText] = useState("");

  const ask = useCallback(
    (raw: string) => {
      const q = raw.trim();
      if (!q) return;
      const id = ++nextId.current;
      setItems((l) => [{ id, q, state: "thinking" }, ...l]);
      timers.current.push(
        setTimeout(() => {
          const m = matchAnswer(q, answers);
          setItems((l) => l.map((it) => (it.id === id ? (m ? { id, q, state: "answer", answer: m, fresh: true } : { id, q, state: "unknown" }) : it)));
        }, THINK_MS),
      );
    },
    [answers],
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
    ask(initialQuestion);
    router.replace("/ask", { scroll: false });
  }, [initialQuestion, ask, router]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(text);
    setText("");
  };

  return (
    <>
      <section className="ask-hero fade rounded-lg border border-border shadow-[0_1px_2px_rgba(16,24,40,.04)]">
        <div>
          <h2 className="text-lg font-semibold tracking-[-.015em]">Ask your data</h2>
          <p className="mt-0.5 text-text2">Plain-English answers from your events. Every answer shows the numbers and query behind it.</p>
        </div>
        <form className="ask-input" onSubmit={submit}>
          <Icon name="spark" />
          <input
            name="q"
            value={text}
            onChange={(e) => setText(e.target.value)}
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
            <Chip key={s} onClick={() => ask(s)}>
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
