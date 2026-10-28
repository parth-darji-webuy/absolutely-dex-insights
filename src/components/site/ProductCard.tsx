import { Icon } from "@/components/Icon";
import { fmt, pct } from "@/lib/format";
import type { QuickViewStats } from "@/types";
import { Hot } from "./Hot";

/**
 * The store's product card. With `qv` the Quick View button and eye icon are shown, with the
 * share of people who used them; without it the card says there is no quick view in this version.
 */
export function ProductCard({ quick = true, qv, onOpen }: { quick?: boolean; qv?: QuickViewStats; /** Makes the Quick View button and eye icon clickable. */ onOpen?: () => void }) {
  const share = (n: number) => (qv && qv.seen > 0 ? pct((n / qv.seen) * 100) : "—");
  return (
    <div className="site site-card">
      <div className="sc-img" style={{ backgroundImage: "url(/site/quick-view.jpg)" }}>
        <div className="sc-badges">
          <span className="b-red">-20%</span>
          <span className="b-amber">Trending</span>
          <span className="b-violet">New</span>
        </div>
        <button className="sc-heart hs" tabIndex={-1} aria-label="Wishlist">
          <Icon name="heartS" />
          {qv && (
            <Hot lo tip={`Wishlisted from the card: ${fmt(qv.heartCard)} of ${fmt(qv.seen)}`}>
              {share(qv.heartCard)}
            </Hot>
          )}
        </button>
        {quick ? (
          <div className="sc-actions">
            <button className={`sc-qv hs${onOpen ? " qv-open" : ""}`} tabIndex={onOpen ? 0 : -1} onClick={onOpen}>
              <Icon name="bag" size="sm" /> Quick View
              {qv && <Hot tip={`Opened via the Quick View button: ${fmt(qv.btn)} of ${fmt(qv.seen)} who saw it`}>{share(qv.btn)}</Hot>}
            </button>
            <button className={`sc-eye hs${onOpen ? " qv-open" : ""}`} tabIndex={onOpen ? 0 : -1} aria-label="Quick view" onClick={onOpen}>
              <Icon name="eye" size="sm" />
              {qv && (
                <Hot lo tip={`Opened via the eye icon: ${fmt(qv.eye)} of ${fmt(qv.seen)}`}>
                  {share(qv.eye)}
                </Hot>
              )}
            </button>
          </div>
        ) : (
          <div className="sc-note">No quick view in this version</div>
        )}
      </div>
      <div className="sc-body">
        <div className="sc-row">
          <span className="sc-brand">CHRONOS ATELIER</span>
          <span className="sc-stars">
            <b>★★★★★</b> 5.0 (19)
          </span>
        </div>
        <div className="sc-title">Chronos Obsidian Sapphire Watch</div>
        <div className="sc-price">
          <b>£520.00</b>
          <s>£650.00</s>
        </div>
      </div>
    </div>
  );
}
