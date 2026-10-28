import { type ReactNode, Suspense } from "react";
import { SkeletonStack } from "@/components/ui/Skeleton";
import { products } from "@/lib/queries";
import type { Experiment } from "@/types";
import { BuyBox } from "./BuyBox";
import { ProductCard } from "./ProductCard";
import { StoreHeader } from "./StoreHeader";

const Wrap = ({ caption, children }: { caption: string; children: ReactNode }) => (
  <div className="pv-wrap">
    <span className="self-start text-xs text-text3">{caption}</span>
    {children}
  </div>
);

async function QuickPreview({ side }: { side: "c" | "t" }) {
  const { qv } = await products();
  return (
    <Wrap caption={side === "t" ? "On your site · number = share of people who saw the card" : "On your site"}>
      <ProductCard quick={side === "t"} qv={side === "t" ? qv : undefined} />
    </Wrap>
  );
}

/** What this side of the test looks like on the store, with the numbers on the tested element. */
export function VariantPreview({ e, side }: { e: Experiment; side: "c" | "t" }) {
  if (e.preview === "whatsnew" || e.preview === "theme")
    return (
      <Wrap caption={`Header on your site · number = share who ${e.verb}`}>
        <StoreHeader e={e} side={side} />
      </Wrap>
    );
  if (e.preview === "quick")
    return (
      <Suspense
        fallback={
          <Wrap caption="On your site">
            <SkeletonStack kind="chart" />
          </Wrap>
        }
      >
        <QuickPreview side={side} />
      </Suspense>
    );
  return (
    <Wrap caption="Product page on your site · number = share who added to cart">
      <BuyBox e={e} side={side} />
    </Wrap>
  );
}
