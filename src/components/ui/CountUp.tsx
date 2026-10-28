"use client";

import { useLayoutEffect, useRef } from "react";
import { fmt, pct } from "@/lib/format";

const format = (v: number, as: "int" | "pct") => (as === "int" ? fmt(v) : pct(v));

/** A number that counts up from zero in 0.9 s. With reduced motion it just shows the number. */
export function CountUp({ value, as = "int" }: { value: number; as?: "int" | "pct" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const safe = Number.isFinite(value) ? value : 0;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 900);
      el.textContent = format(safe * (1 - Math.pow(1 - k, 3)), as);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    el.textContent = format(0, as);
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [safe, as]);

  return (
    <span ref={ref} className="tabular-nums" suppressHydrationWarning>
      {format(safe, as)}
    </span>
  );
}
