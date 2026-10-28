"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fmt, pct } from "@/lib/format";
import { ofOpened } from "@/lib/products";
import type { QuickViewStats } from "@/types";
import { QuickViewModal } from "./QuickViewModal";

const code = (t: string) => (
  <code key={t} className="rounded-[5px] border border-border bg-card2 px-1.5 py-px text-[11px] text-text2">
    {t}
  </code>
);

/** "Your quick view, with click data": the product card with numbers on it, and a button that opens the modal. */
export function QuickViewCard({ qv, weekLabel }: { qv: QuickViewStats; weekLabel: string }) {
  const [open, setOpen] = useState(false);
  const via = (n: number) => (qv.opened > 0 ? pct((n / qv.opened) * 100, 0) : "—");
  const tiles = [
    ["Opened quick view", fmt(qv.opened), pct(qv.seen > 0 ? (qv.opened / qv.seen) * 100 : NaN)],
    ["Then added to cart", fmt(qv.add), pct(ofOpened(qv, qv.add))],
    ["Via the button", fmt(qv.btn), via(qv.btn)],
    ["Via the eye icon", fmt(qv.eye), via(qv.eye)],
  ];
  return (
    <Card
      title="Your quick view, with click data"
      subtitle="How people use the Quick View on your product cards this week"
      actions={
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          <Icon name="eye" size="sm" /> Open quick view
        </Button>
      }
      source={{ tables: [code("quickview_tracking"), code("quick_view_cart_events")], gap: "Button views, wishlist and detail clicks not tracked yet" }}
      delay={110}
    >
      <div className="site-pair">
        <div>
          <div className="cap">Product card · {fmt(qv.seen)} people saw the button</div>
          <ProductCard qv={qv} onOpen={() => setOpen(true)} />
        </div>
        <div className="w-full max-w-[380px] self-center">
          <div className="qv-outcomes !grid-cols-2">
            {tiles.map(([l, v, p]) => (
              <div key={l}>
                <span>{l}</span>
                <b>{v}</b>
                <em>{p}</em>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-text3">
            Click <b>Quick View</b> on the card to see the modal with what people did inside it.
          </p>
        </div>
      </div>
      <QuickViewModal open={open} onClose={() => setOpen(false)} qv={qv} weekLabel={weekLabel} />
    </Card>
  );
}
