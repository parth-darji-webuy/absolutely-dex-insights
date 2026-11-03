"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { journeyText, VARIANT_SOURCE } from "@/lib/events";
import { clock } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AnalyticsEvent, EventDetail, EventMeta, EventType } from "@/types";
import { EventName } from "./EventName";

type Props = {
  event: AnalyticsEvent | null;
  meta: Record<EventType, EventMeta>;
  open: boolean;
  onClose: () => void;
};

const Code = ({ children }: { children: React.ReactNode }) => <code>{children}</code>;

/** Why the page can say which variant a row belongs to. */
function VariantNotice({ type }: { type: EventType }) {
  const v = VARIANT_SOURCE[type];
  if (v === "yes" || v === "no") return null;
  return (
    <div className="notice">
      <Icon name="info" />
      {v === "stored" && (
        <span>
          <Code>whats_new_tracking</Code> stores its own copy of the variant. Insights still takes the variant from <Code>experiment_tracking</Code>, so both pages always agree.
        </span>
      )}
    </div>
  );
}

type Loaded = { key: string; state: "ready"; data: EventDetail } | { key: string; state: "missing" | "error" };

function Problem({ missing, onRetry }: { missing: boolean; onRetry: () => void }) {
  return (
    <div className="notice !justify-between" role="alert">
      <span>{missing ? "This row is no longer in the database." : "Couldn’t load the details."}</span>
      {!missing && (
        <Button size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

const H4 = ({ children }: { children: React.ReactNode }) => <h4 className="mb-2.5 text-xs font-semibold tracking-[.06em] text-text3 uppercase">{children}</h4>;

export function EventDrawer({ event: e, meta, open, onClose }: Props) {
  const router = useRouter();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = e ? `${e.table}/${e.rowId}/${attempt}` : "";

  // Ask the server for the row as stored and the visitor's journey whenever a row is opened.
  useEffect(() => {
    if (!open || !e) return;
    const ctl = new AbortController();
    fetch(`/api/events/detail?tbl=${encodeURIComponent(e.table)}&id=${encodeURIComponent(e.rowId)}`, { cache: "no-store", signal: ctl.signal })
      .then(async (res) => {
        if (res.status === 401) return router.push("/sign-in");
        if (res.status === 404) return setLoaded({ key, state: "missing" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        setLoaded({ key, state: "ready", data: (await res.json()) as EventDetail });
      })
      .catch((err) => err?.name !== "AbortError" && setLoaded({ key, state: "error" }));
    return () => ctl.abort();
  }, [open, e, key, router]);

  const current = loaded?.key === key ? loaded : null;
  const detail = current?.state === "ready" ? current.data : null;

  return (
    <Drawer
      open={open && !!e}
      onClose={onClose}
      title={e ? <EventName type={e.event} meta={meta} className="!text-[15px]" /> : "Event"}
      subtitle={
        e && (
          <>
            {clock(e.ts)} · row in <code className="rounded-[5px] border border-border bg-card2 px-1.5 py-px text-[11px] text-text2">{e.table}</code> · visitor <span className="font-mono text-xs">{e.visitor}</span>
          </>
        )
      }
    >
      {e && (
        <>
          <div>
            <H4>Visitor journey</H4>
            {detail ? (
              <div className="journey">
                {[...detail.journey.steps].reverse().map((s) => {
                  const [t, sub] = journeyText(s);
                  const cur = s.rowId === e.rowId && s.table === e.table;
                  return (
                    <div key={`${s.table}/${s.rowId}`} className={`jstep ${cur ? "cur" : ""}`} style={{ "--c": meta[s.event]?.c ?? "var(--text3)" } as React.CSSProperties}>
                      <span className="jd" />
                      <div>
                        <b>{t}</b>
                        {sub && <p>{sub}</p>}
                      </div>
                      <span className="t">{clock(s.ts)}</span>
                    </div>
                  );
                })}
                {detail.journey.earlier > 0 && <p className="pt-1 pl-7 text-xs text-text3">and {detail.journey.earlier} earlier</p>}
              </div>
            ) : current ? (
              <Problem missing={current.state === "missing"} onRetry={() => setAttempt((n) => n + 1)} />
            ) : (
              <div className="flex flex-col gap-3" aria-busy="true">
                <Skeleton w="70%" h={14} />
                <Skeleton w="55%" h={14} />
                <Skeleton w="62%" h={14} />
              </div>
            )}
          </div>
          <VariantNotice type={e.event} />
        </>
      )}
    </Drawer>
  );
}
