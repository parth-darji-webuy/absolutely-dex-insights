import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { fmt, pct } from "@/lib/format";
import { verbFor } from "@/lib/verb";
import type { Experiment } from "@/types";
import { Hot } from "./Hot";

/** The store's header, as on the site. Used for the menu link and theme toggle tests. */
export function StoreHeader({ e, side }: { e: Experiment; side: "c" | "t" }) {
  const v = e[side];
  const rate = side === "c" ? e.rc : e.rt;
  const pill = (
    <Hot lo={side === "c"} tip={`${fmt(v.conv)} of ${fmt(v.people)} people who saw “${v.label}” ${verbFor(e, side)}`}>
      {pct(rate)}
    </Hot>
  );
  const isNew = e.preview === "whatsnew";
  const isTheme = e.preview === "theme";
  const wnHi = isNew && side === "t";
  const dark = isTheme && side === "t";
  return (
    <div className="hdr-box">
      <div className={cn("site hdr", dark && "dark")}>
        <div className="hdr-logo">
          Absolutely<span>DeX</span>
          <small>FASHION · TECHNOLOGY · WHAT’S NEXT</small>
        </div>
        <div className="hdr-nav">
          <span>Shop</span>
          <span>Fashion</span>
          <span>Technology</span>
          <span className={cn("wn", (wnHi || !isNew) && "hi", isNew && "hs")}>
            {isNew ? v.label : "What’s New"}
            {wnHi && <i className="nb">NEW</i>}
            {isNew && pill}
          </span>
        </div>
        <div className="hdr-icons">
          <span className={cn("hdr-ib theme", isTheme && "hs")}>
            <Icon name={dark ? "sunS" : "moonS"} size="sm" />
            {isTheme && pill}
          </span>
          <span className="hdr-ib">
            <Icon name="heartS" size="sm" />
          </span>
          <span className="hdr-ib cart">
            <Icon name="bag" size="sm" />
          </span>
        </div>
      </div>
    </div>
  );
}
