"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { QuickViewModal } from "@/components/products/QuickViewModal";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ago, clock } from "@/lib/format";
import type { AnalyticsEvent, EventMeta, EventType, QuickViewStats } from "@/types";
import { EventDrawer } from "./EventDrawer";
import { EventName } from "./EventName";

type Props = {
  /** Newest first. The table shows the latest 40; the drawer's journey looks at all of them. */
  events: AnalyticsEvent[];
  meta: Record<EventType, EventMeta>;
  qv: QuickViewStats;
  weekLabel: string;
};

const SHOWN = 40;

/** The latest events. Each "35s ago" keeps counting, and a row opens the drawer. */
export function EventsTable({ events, meta, qv, weekLabel }: Props) {
  const [, tick] = useState(0);
  const [selected, setSelected] = useState<AnalyticsEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [quickView, setQuickView] = useState(false);

  // "Ns ago" depends on the current time, so the server and the first client render would differ.
  // Show it only in the browser: false while rendering on the server and during hydration, true after.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const shown = events.slice(0, SHOWN);
  const show = (e: AnalyticsEvent) => {
    setSelected(e);
    setOpen(true);
  };

  return (
    <>
      <Card delay={60} flush bodyClassName="!pt-0">
        {shown.length === 0 ? (
          <EmptyState title="No events yet" text="Events will show up here as soon as people visit the store." />
        ) : (
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Table</th>
                  <th>Product</th>
                  <th>Visitor</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((e) => (
                  <tr
                    key={e.id}
                    className="click"
                    tabIndex={0}
                    aria-label={`${meta[e.event]?.label ?? e.event}${mounted ? `, ${ago(e.ts)}` : ""}. Open details`}
                    onClick={() => show(e)}
                    onKeyDown={(k) => {
                      if (k.key === "Enter" || k.key === " ") {
                        k.preventDefault();
                        show(e);
                      }
                    }}
                  >
                    <td className="tabular-nums" suppressHydrationWarning>
                      <span>{clock(e.ts)}</span> <span className="text-xs text-text3">{mounted ? ago(e.ts) : ""}</span>
                    </td>
                    <td>
                      <EventName type={e.event} meta={meta} />
                    </td>
                    <td>
                      <code className="rounded-[5px] border border-border bg-card2 px-1.5 py-px text-[11px] text-text2">{e.table}</code>
                    </td>
                    <td>{e.product ?? <span className="text-text3">—</span>}</td>
                    <td>
                      <span className="vid">{e.visitor}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <EventDrawer
        event={selected}
        meta={meta}
        open={open}
        onClose={() => setOpen(false)}
        onSeeQuickView={() => {
          setOpen(false);
          setQuickView(true);
        }}
      />
      <QuickViewModal open={quickView} onClose={() => setQuickView(false)} qv={qv} weekLabel={weekLabel} />
    </>
  );
}
