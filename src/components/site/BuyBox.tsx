import { Icon } from "@/components/Icon";
import { fmt, pct } from "@/lib/format";
import type { Experiment } from "@/types";
import { Hot } from "./Hot";

/** The product page's buy box, with the button text that was tested and how many people used it. */
export function BuyBox({ e, side }: { e: Experiment; side: "c" | "t" }) {
  const v = e[side];
  const rate = side === "c" ? e.rc : e.rt;
  return (
    <div className="site bb">
      <div className="bb-img" style={{ backgroundImage: "url(/site/camera.jpg)" }}>
        <span className="bb-off">-8% OFF</span>
      </div>
      <div>
        <div className="qv-brand">APERTURE OPTICS</div>
        <div className="bb-title">Aperture R4 Mirrorless 8K Camera</div>
        <div className="sc-stars">
          <b>★★★★★</b> 4.9 (29)
        </div>
        <div className="bb-price">
          <b>£3299.00</b>
          <s>£3599.00</s>
        </div>
        <div className="bb-opt">
          <span className="on">Body Only</span>
          <span>Body + 24-70mm Kit</span>
        </div>
        <div className="bb-buy">
          <div className="bb-qty">
            <span>-</span>
            <span>1</span>
            <span>+</span>
          </div>
          <button className="bb-btn hs" tabIndex={-1}>
            <Icon name="bag" size="sm" /> {v.label}
            <Hot lo={side === "c"} tip={`${fmt(v.conv)} of ${fmt(v.people)} people who saw “${v.label}” added to cart`}>
              {pct(rate)}
            </Hot>
          </button>
          <span className="bb-heart">
            <Icon name="heartS" size="sm" />
          </span>
        </div>
      </div>
    </div>
  );
}
