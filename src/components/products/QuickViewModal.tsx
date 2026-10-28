"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { QuickViewReplica } from "@/components/site/QuickViewReplica";
import { Modal } from "@/components/ui/Modal";
import { fmt, pct } from "@/lib/format";
import { ofOpened, quickViewInsight } from "@/lib/products";
import type { QuickViewStats } from "@/types";

type Props = { open: boolean; onClose: () => void; qv: QuickViewStats; weekLabel: string };

/** The store's Quick View as shoppers see it, with a switch that lays the click data on top. */
export function QuickViewModal({ open, onClose, qv, weekLabel }: Props) {
  const [heat, setHeat] = useState(true);
  const outcomes = [
    ["Added to cart", qv.add],
    ["Opened product detail", qv.detail],
    ["Wishlisted", qv.wish],
    ["Closed without acting", qv.closed],
  ] as const;
  return (
    <Modal open={open} onClose={onClose} title="Quick view, as your shoppers see it" subtitle={`Opened by ${fmt(qv.opened)} people this week${weekLabel ? ` · ${weekLabel}` : ""} · numbers show what they clicked`}>
      <div className="qv-shell">
        <div className="qv-bar">
          <button type="button" role="switch" aria-checked={heat} className={`switch ${heat ? "on" : ""}`} onClick={() => setHeat((h) => !h)}>
            <span className="k" />
            Show click data
          </button>
          <span className="text-xs text-text3">Hover a number for the exact counts</span>
          <div className="grow" />
          <Link href="/products" className="link" onClick={onClose}>
            See the funnel <Icon name="chevR" size="sm" />
          </Link>
        </div>
        <QuickViewReplica qv={qv} heat={heat} />
        <div className="qv-outcomes">
          {outcomes.map(([label, n]) => (
            <div key={label}>
              <span>{label}</span>
              <b>{fmt(n)}</b>
              <em>{pct(ofOpened(qv, n))}</em>
            </div>
          ))}
        </div>
        <div className="notice">
          <Icon name="info" /> {quickViewInsight(qv)}
        </div>
      </div>
    </Modal>
  );
}
