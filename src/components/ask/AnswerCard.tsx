"use client";

import { useEffect, useState } from "react";
import { HBars } from "@/components/charts";
import { Icon } from "@/components/Icon";
import { Card } from "@/components/ui/Card";
import { SkeletonStack } from "@/components/ui/Skeleton";
import { Tag } from "@/components/ui/Tag";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TRACKING_TABLES } from "@/lib/tables";
import type { Answer } from "@/types";

export type AskBody =
  | { state: "thinking" }
  /** A reply that is not an answer: a refusal, "the AI is busy", too many questions... */
  | { state: "notice"; title: string; detail?: string; tables?: boolean }
  | { state: "answer"; answer: Answer; fresh: boolean };

export type AskItem = { id: number; q: string } & AskBody;

const Question = ({ q }: { q: string }) => (
  <div className="q">
    <Icon name="user" size="sm" /> {q}
  </div>
);

/** Types the answer out two characters at a time, unless the visitor asked for less motion. */
function TypedText({ text, animate }: { text: string; animate: boolean }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(animate && !reduced ? 0 : text.length);
  useEffect(() => {
    if (!animate || reduced) return;
    let i = 0;
    const t = setInterval(() => {
      i += 2;
      setN(i);
      if (i >= text.length) clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, [text, animate, reduced]);
  const done = n >= text.length;
  return (
    <div className={`a ${done ? "" : "typing"}`} aria-live="polite">
      {done ? text : text.slice(0, n)}
    </div>
  );
}

export function AnswerCard({ item, index }: { item: AskItem; index: number }) {
  if (item.state === "thinking")
    return (
      <Card bodyClassName="!p-0">
        <div className="answer" role="status">
          <Question q={item.q} />
          <div className="thinking">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>{" "}
            Looking at your events…
          </div>
          <SkeletonStack kind="text" />
        </div>
      </Card>
    );
  if (item.state === "notice")
    return (
      <Card bodyClassName="!p-0">
        <div className="answer" role="status">
          <Question q={item.q} />
          <div className="a">{item.title}</div>
          {item.tables ? (
            <div className="text-[13px] text-text2">
              Insights only answers from your tracking tables:{" "}
              {TRACKING_TABLES.map((t, i) => (
                <span key={t}>
                  {i > 0 && ", "}
                  <code>{t}</code>
                </span>
              ))}
              , and the product list. Try one of the suggestions above.
            </div>
          ) : (
            item.detail && <div className="text-[13px] text-text2">{item.detail}</div>
          )}
        </div>
      </Card>
    );
  const a = item.answer;
  return (
    <Card bodyClassName="!p-0" delay={index * 60}>
      <div className="answer">
        <div className="row justify-between">
          <Question q={item.q} />
          <Tag tone="ai">
            <Icon name="spark" size="sm" /> AI answer · Groq
          </Tag>
        </div>
        <TypedText text={a.a} animate={item.fresh} />
        <HBars rows={a.bars} unit={a.unit === "%" ? "%" : ""} />
        <details>
          <summary>
            <Icon name="chev" size="sm" className="chev" /> Show the query / numbers
          </summary>
          <div className="inner">
            <table className="mini">
              <thead>
                <tr>
                  {a.cols.map((c, j) => (
                    <th key={c} className={j ? "r" : ""}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} className={j ? "r" : ""}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <pre className="query">{a.sql}</pre>
          </div>
        </details>
      </div>
    </Card>
  );
}
