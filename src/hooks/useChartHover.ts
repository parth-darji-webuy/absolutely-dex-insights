"use client";

import { type MouseEvent, useState } from "react";
import { nearestIndex } from "@/components/charts/chart-utils";
import { useTip } from "@/components/ui/Tooltip";

type Geometry = { W: number; n: number; pl: number; pr: number; band?: number };

/** Hover handling for charts with one point or bar per label: which index, and the shared tip. */
export function useChartHover({ W, n, pl, pr, band }: Geometry, tipFor: (i: number) => React.ReactNode) {
  const tip = useTip();
  const [index, setIndex] = useState<number | null>(null);

  const onMouseMove = (e: MouseEvent<SVGElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg || n < 1) return;
    const r = svg.getBoundingClientRect();
    if (!r.width) return;
    const i = nearestIndex(((e.clientX - r.left) / r.width) * W, n, pl, pr, W, band);
    setIndex(i);
    tip.show(tipFor(i), e.clientX, e.clientY);
  };
  const onMouseLeave = () => {
    setIndex(null);
    tip.hide();
  };
  return { index, handlers: { onMouseMove, onMouseLeave } };
}
