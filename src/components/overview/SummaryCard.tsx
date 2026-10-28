import { Icon } from "@/components/Icon";
import { fmt, pct } from "@/lib/format";
import { experiments, overview } from "@/lib/queries";
import { sum } from "@/lib/rng";
import { KvGrid } from "./KvGrid";
import { SummaryBody } from "./NumbersToggle";

export async function SummaryCard() {
  const [o, exps] = await Promise.all([overview(), experiments()]);
  const now = sum(o.addToCarts);
  const before = o.addToCartsPrevWeek;
  const change = before > 0 ? (now / before - 1) * 100 : NaN;
  const test = exps.find((e) => e.key === "add-to-cart");
  const leader = test?.lead ? test.t : null;

  const headline =
    !(now > 0) && !(before > 0)
      ? "No add-to-carts yet this week."
      : Number.isFinite(change) && Math.abs(change) >= 0.05
        ? `Add-to-cart is ${change > 0 ? "up" : "down"} ${Math.abs(change).toFixed(0)}% this week${leader ? `, led by the ${leader.label} variant` : ""}.`
        : Number.isFinite(change)
          ? "Add-to-cart is about the same as last week."
          : `${fmt(now)} add-to-carts this week, nothing from last week to compare with.`;

  const diff = now - before;
  const rows: [string, string][] = [
    ["Add to cart · this week", fmt(now)],
    ["Add to cart · last week", fmt(before)],
    ["Change", Number.isFinite(change) ? `${diff >= 0 ? "+" : "−"}${fmt(Math.abs(diff))} (${change >= 0 ? "▲" : "▼"} ${pct(Math.abs(change))})` : "—"],
  ];
  if (test)
    for (const v of [test.t, test.c]) rows.push([`${v.label} · added to cart`, `${fmt(v.conv)} of ${fmt(v.people)} (${v.people > 0 ? pct((v.conv / v.people) * 100) : "—"})`]);

  return (
    <section className="fade flex items-start gap-3.5 rounded-lg border border-border bg-[linear-gradient(90deg,var(--accent-soft),transparent_70%)] bg-card px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,.04)]">
      <div className="grid size-8 flex-none place-items-center rounded-[9px] bg-accent-soft text-accent-text">
        <Icon name="spark" />
      </div>
      <SummaryBody line={headline} numbers={<KvGrid items={rows} />} />
    </section>
  );
}
