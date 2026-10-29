"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { SkeletonStack } from "@/components/ui/Skeleton";
import { Tag } from "@/components/ui/Tag";
import { liftText, remaining, trafficSplit } from "@/lib/experiment";
import { fmt, pct } from "@/lib/format";
import type { Experiment } from "@/types";

const B = ({ children }: { children: React.ReactNode }) => <b>{children}</b>;

function Words({ e }: { e: Experiment }) {
  const left = remaining(e);
  const traffic = trafficSplit(e);
  const days = left.days ? ` (~${left.days} days)` : "";
  if (e.key === "add-to-cart" && e.lift > 0)
    return (
      <>
        <p>
          People who saw <B>“{e.t.label}”</B> added a product to their cart more often than people who saw <B>“{e.c.label}”</B>: about <B>{Math.round(e.rt)} in every 100</B> instead of <B>{Math.round(e.rc)}</B>. That’s a{" "}
          {Math.round(e.lift)}% relative improvement.
        </p>
        <p>
          With {fmt(e.people)} people so far, there’s roughly a <B>{e.chance}% chance</B> {e.t.label} is genuinely better and not just luck. That’s promising but not settled.
          {left.people > 0 && ` About ${fmt(left.people)} more people${left.days ? ` (~${left.days} days at the current pace)` : ""} would make it safer.`}
        </p>
        {traffic.off && (
          <p>
            One thing to keep an eye on: the traffic split was uneven in the last 24 hours ({fmt(traffic.c)} vs {fmt(traffic.t)} people). Check tracking before you decide.
          </p>
        )}
      </>
    );
  return (
    <>
      <p>
        <B>“{e.t.label}”</B>: <B>{pct(e.rt)}</B> of people {e.verb}, vs <B>{pct(e.rc)}</B> for <B>“{e.c.label}”</B>
        {e.rc > 0 ? `, a ${e.lift > 0 ? "lift" : "drop"} of ${pct(Math.abs(e.lift))}` : ""}.
      </p>
      <p>
        The chance the treatment is better is about <B>{e.chance}%</B>. {e.chance >= 95 ? "That’s strong evidence." : "That’s too uncertain to act on."}{" "}
        {left.people > 0 ? `About ${fmt(left.people)} more people${days} are needed.` : "You have all the people you planned for."}
      </p>
    </>
  );
}

type Written = { state: "idle" | "loading" | "rules" } | { state: "ai"; paragraphs: string[] };

/**
 * The "Explain this" button and the drawer it opens: plain words first, then every number used.
 * With `ai` on, Groq writes the words when the drawer is first opened; if it can't, the app's own words are shown.
 */
export function ExplainButton({ e, ai = false }: { e: Experiment; ai?: boolean }) {
  const [open, setOpen] = useState(false);
  const [written, setWritten] = useState<Written>({ state: "idle" });
  const show = () => {
    setOpen(true);
    if (!ai || written.state !== "idle") return;
    setWritten({ state: "loading" });
    fetch("/api/experiments/explain", { method: "POST", body: JSON.stringify({ key: e.key }) })
      .then(async (res) => {
        const body: unknown = res.ok ? await res.json() : null;
        const paragraphs = (body as { paragraphs?: unknown } | null)?.paragraphs;
        setWritten(Array.isArray(paragraphs) && paragraphs.length > 0 && paragraphs.every((p) => typeof p === "string") ? { state: "ai", paragraphs } : { state: "rules" });
      })
      .catch(() => setWritten({ state: "rules" }));
  };
  const pace = e.days > 0 ? Math.round(e.people / e.days) : null;
  const nums: [string, string][] = [
    ["Control · people who saw it", fmt(e.c.people)],
    [`Control · ${e.verb}`, `${fmt(e.c.conv)} (${pct(e.rc)})`],
    ["Treatment · people who saw it", fmt(e.t.people)],
    [`Treatment · ${e.verb}`, `${fmt(e.t.conv)} (${pct(e.rt)})`],
    ["Relative lift", liftText(e)],
    ["Chance treatment is better", `${e.chance}%`],
    ["People needed", `~${fmt(e.needed)}`],
    ["Pace", pace === null ? "—" : `~${fmt(pace)} people/day`],
  ];
  return (
    <>
      <Button onClick={show}>
        <Icon name="spark" /> Explain this
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={
          <span className="inline-flex items-center gap-2">
            <Icon name="spark" /> Explain this experiment
          </span>
        }
        subtitle={e.name}
      >
        <div>
          <Tag tone={written.state === "ai" ? "ai" : "default"}>{written.state === "ai" ? "Written by AI (Groq) from the numbers below" : written.state === "loading" ? "Asking the AI…" : "Written from the numbers, no AI"}</Tag>
        </div>
        {written.state === "loading" ? (
          <SkeletonStack kind="text" />
        ) : (
          <div className="flex flex-col gap-3 text-sm leading-[1.6]">
            {written.state === "ai" ? written.paragraphs.map((p, i) => <p key={i}>{p}</p>) : <Words e={e} />}
          </div>
        )}
        <div>
          <h4 className="mb-2.5 text-xs font-semibold tracking-[.06em] text-text3 uppercase">Numbers used</h4>
          <div className="flex flex-col overflow-hidden rounded-[10px] border border-border">
            {nums.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border px-3.5 py-[9px] text-[13px] last:border-b-0">
                <span className="text-text3">{k}</span>
                <b className="font-semibold tabular-nums">{v}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-[9px] rounded-[9px] border border-border bg-card2 px-3 py-2.5 text-[12.5px] text-text2">
          <Icon name="info" /> Insights explains the numbers; it doesn’t decide. The official result lives in GrowthBook.
        </div>
      </Drawer>
    </>
  );
}
