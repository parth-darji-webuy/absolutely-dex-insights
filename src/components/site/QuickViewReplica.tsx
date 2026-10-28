import { Icon } from "@/components/Icon";
import { fmt, pct } from "@/lib/format";
import { ofOpened } from "@/lib/products";
import type { QuickViewStats } from "@/types";
import { Hot } from "./Hot";

/** The store's own Quick View modal. With `heat` on, each button carries the share of people who used it. */
export function QuickViewReplica({ qv, heat }: { qv: QuickViewStats; heat: boolean }) {
  const p = (n: number) => pct(ofOpened(qv, n));
  const a = (n: number) => (qv.opened > 0 ? (0.15 + (n / qv.opened) * 2).toFixed(2) : "0.15");
  return (
    <div className={`site qv-modal ${heat ? "heat-on" : "heat-off"}`}>
      <button className="qv-close" tabIndex={-1} aria-label="Close">
        <Icon name="x" />
      </button>
      <div>
        <div className="qv-gal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/site/quick-view.jpg" alt="Chronos Obsidian Sapphire Watch" />
        </div>
        <div className="qv-thumb" style={{ backgroundImage: "url(/site/quick-view.jpg)" }} />
      </div>
      <div>
        <div className="qv-brand">CHRONOS ATELIER</div>
        <div className="qv-title">Chronos Obsidian Sapphire Watch</div>
        <div className="sc-stars">
          <b>★★★★★</b> 5.0 (19)
        </div>
        <p className="qv-desc">
          Architectural analog timepiece featuring a DLC-coated grade 5 titanium case, scratch-proof sapphire crystal dome, Japanese automatic movement with 42-hour power reserve, and interchangeable fluororubber strap.
        </p>
        <div className="qv-pricebox">
          <b>£520.00</b>
          <s>£650.00</s>
          <span className="qv-off">-20% OFF</span>
        </div>
        <div className="qv-buy">
          <div className="qv-qty">
            <span>-</span>
            <span>1</span>
            <span>+</span>
          </div>
          <button className="qv-add hs" style={{ "--a": a(qv.add), borderRadius: 12 } as React.CSSProperties} tabIndex={-1}>
            <Icon name="bag" /> Add to Cart
            <Hot tip={`Added to cart from quick view: ${fmt(qv.add)} of ${fmt(qv.opened)} who opened it`}>{p(qv.add)}</Hot>
          </button>
        </div>
        <div className="qv-row2">
          <button className="qv-wish hs" style={{ "--a": a(qv.wish) } as React.CSSProperties} tabIndex={-1}>
            <Icon name="heartS" /> Wishlist
            <Hot lo tip={`Wishlisted: ${fmt(qv.wish)} of ${fmt(qv.opened)}`}>
              {p(qv.wish)}
            </Hot>
          </button>
          <button className="qv-detail hs" style={{ "--a": a(qv.detail) } as React.CSSProperties} tabIndex={-1}>
            Product Detail <Icon name="arrow" size="sm" />
            <Hot tip={`Went to the product page: ${fmt(qv.detail)} of ${fmt(qv.opened)}`}>{p(qv.detail)}</Hot>
          </button>
        </div>
        <div className="qv-trust">
          <span style={{ color: "#5B3FE0" }}>
            <Icon name="truck" />
          </span>
          <span style={{ color: "#0f9d6b" }}>
            <Icon name="shield" />
          </span>
          <span style={{ color: "#e8761c" }}>
            <Icon name="refresh" />
          </span>
        </div>
      </div>
    </div>
  );
}
