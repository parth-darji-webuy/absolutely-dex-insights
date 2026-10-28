import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { fmt, pct } from "@/lib/format";
import type { Experiment } from "@/types";
import { Hot } from "./Hot";

/** The store's header, as on the site. Used for the What's New and theme toggle tests. */
export function StoreHeader({ e, side }: { e: Experiment; side: "c" | "t" }) {
  const v = e[side];
  const rate = side === "c" ? e.rc : e.rt;
  const pill = (
    <Hot lo={side === "c"} tip={`${fmt(v.conv)} of ${fmt(v.people)} people who saw “${v.label}” ${e.verb}`}>
      {pct(rate)}
    </Hot>
  );
  const isNew = e.preview === "whatsnew";
  const isTheme = e.preview === "theme";
  const wnHi = isNew && side === "t";
  const wide = isTheme && side === "t";
  return (
    <div className="site hdr">
      <div className="hdr-logo">
        Absolutely<span>DeX</span>
        <small>FASHION · TECHNOLOGY · WHAT’S NEXT</small>
      </div>
      <div className="hdr-nav">
        <span>Shop</span>
        <span>Fashion</span>
        <span>Technology</span>
        <span className={cn("wn", (wnHi || !isNew) && "hi", isNew && "hs")}>
          What’s New
          {wnHi && <i className="nb">NEW</i>}
          {isNew && pill}
        </span>
      </div>
      <div className="hdr-icons">
        <span className={cn("hdr-ib theme", isTheme && "hs", wide && "wide")}>
          <Icon name="moonS" size="sm" />
          {wide && <em>Dark mode</em>}
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
  );
}
