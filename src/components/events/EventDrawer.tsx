"use client";

import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/Toast";
import { journeyOf, journeyText, storedRow, VARIANT_SOURCE } from "@/lib/events";
import { clock } from "@/lib/format";
import type { AnalyticsEvent, EventMeta, EventType } from "@/types";
import { EventName } from "./EventName";

type Props = {
  event: AnalyticsEvent | null;
  events: AnalyticsEvent[];
  meta: Record<EventType, EventMeta>;
  open: boolean;
  onClose: () => void;
  onSeeQuickView: () => void;
};

const Code = ({ children }: { children: React.ReactNode }) => <code>{children}</code>;

/** Why the page can say which variant a row belongs to. */
function VariantNotice({ type }: { type: EventType }) {
  const v = VARIANT_SOURCE[type];
  if (v === "yes")
    return (
      <div className="notice">
        <Icon name="check" />
        <span>This row is the exposure itself, written by GrowthBook&apos;s trackingCallback.</span>
      </div>
    );
  return (
    <div className="notice">
      <Icon name="info" />
      {v === "hardcoded" && (
        <span>
          <Code>quickview_tracking</Code> stores a hardcoded <Code>experimentKey</Code> and <Code>variationId</Code> from ProductCard.tsx, kept as it is. Insights takes the variant from <Code>experiment_tracking</Code> instead.
        </span>
      )}
      {v === "stored" && (
        <span>
          <Code>whats_new_tracking</Code> stores its own copy of the variant. Insights still takes the variant from <Code>experiment_tracking</Code>, so both pages always agree.
        </span>
      )}
      {v === "no" && (
        <span>
          This table has no variant column. Insights links the row to experiments by matching <Code>anonymousId</Code> with <Code>experiment_tracking</Code>.
        </span>
      )}
    </div>
  );
}

function Json({ row }: { row: Record<string, string | number | boolean | null> }) {
  const entries = Object.entries(row);
  return (
    <pre className="json">
      {"{\n"}
      {entries.map(([k, v], i) => (
        <span key={k}>
          {"  "}
          <span className="k">&quot;{k}&quot;</span>:{" "}
          {v === null ? <span className="text-text3">null</span> : typeof v === "string" ? <span className="s">&quot;{v}&quot;</span> : <span className="n">{String(v)}</span>}
          {i < entries.length - 1 ? ",\n" : "\n"}
        </span>
      ))}
      {"}"}
    </pre>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers or a blocked clipboard: fall back to a hidden text box.
    try {
      const t = document.createElement("textarea");
      t.value = text;
      t.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand("copy");
      t.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

const H4 = ({ children }: { children: React.ReactNode }) => <h4 className="mb-2.5 text-xs font-semibold tracking-[.06em] text-text3 uppercase">{children}</h4>;

export function EventDrawer({ event: e, events, meta, open, onClose, onSeeQuickView }: Props) {
  const { toast } = useToast();
  const steps = e ? journeyOf(events, e.visitor) : [];

  const copy = async () => {
    if (!e) return;
    const ok = await copyText(JSON.stringify(storedRow(e), null, 2));
    if (ok) toast("Payload copied as JSON");
    else toast("Couldn’t copy. Select the text and copy it by hand.", "warn");
  };

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
            <div className="journey">
              {steps.map((s) => {
                const [t, sub] = journeyText(s);
                return (
                  <div key={s.id} className={`jstep ${s.id === e.id ? "cur" : ""}`} style={{ "--c": meta[s.event]?.c ?? "var(--text3)" } as React.CSSProperties}>
                    <span className="jd" />
                    <div>
                      <b>{t}</b>
                      {sub && <p>{sub}</p>}
                    </div>
                    <span className="t">{clock(s.ts)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {e.event === "quick_view_clicked" && (
            <div className="notice !justify-between">
              <span className="flex items-center gap-[9px]">
                <Icon name="eye" /> This visitor opened your quick view.
              </span>
              <Button size="sm" onClick={onSeeQuickView}>
                See what they saw
              </Button>
            </div>
          )}
          <VariantNotice type={e.event} />
          <div>
            <H4>Row as stored</H4>
            <Json row={storedRow(e)} />
          </div>
          <div>
            <Button onClick={copy}>
              <Icon name="copy" /> Copy JSON
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
