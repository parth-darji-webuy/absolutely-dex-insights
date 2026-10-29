import { Icon } from "@/components/Icon";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tooltip } from "@/components/ui/Tooltip";
import { fmt, pct } from "@/lib/format";
import { addRate, coldProducts, heat, overallRate } from "@/lib/products";
import { products } from "@/lib/queries";
import { sum } from "@/lib/rng";
import type { CategoryCount, ColourCount } from "@/types";

const code = (t: string) => (
  <code key={t} className="rounded-[5px] border border-border bg-card2 px-1.5 py-px text-[11px] text-text2">
    {t}
  </code>
);

const ALL_COLS = [
  ["views", "Views"],
  ["qv", "Quick views"],
  ["atc", "Add to cart"],
  ["rate", "Add rate"],
] as const;
type ColKey = (typeof ALL_COLS)[number][0];

/** What the insight line calls a product that is viewed a lot but rarely added, and what to check on it. */
const NOTES: Record<string, [string, string]> = {
  "Linea Relaxed Linen Overshirt": ["Linea Relaxed Linen Overshirt", "the overshirt’s size guide"],
  "Aperture R4 Mirrorless 8K Camera": ["the Aperture R4 camera", "the camera’s product photos and spec details"],
};

export async function HeatGridCard() {
  const { products: list, viewsTracked } = await products();
  // Without product views there is no add rate either, so those two columns are left out.
  const COLS = ALL_COLS.filter(([k]) => viewsTracked || (k !== "views" && k !== "rate"));
  const rows = list.map((p) => ({ ...p, rate: addRate(p) }));
  const value = (r: (typeof rows)[number], k: ColKey) => r[k];
  const range = (k: ColKey) => {
    const v = rows.map((r) => value(r, k)).filter(Number.isFinite);
    return [Math.min(...v), Math.max(...v)] as const;
  };
  const cold = viewsTracked ? coldProducts(list) : [];
  const label = (k: ColKey, v: number) => (k === "rate" ? pct(v) : fmt(v));
  return (
    <Card
      title="Product heat grid"
      subtitle="This week · darker = hotter within each column"
      actions={
        <span className="heat-legend">
          Cool <i /> Hot
        </span>
      }
      source={{ tables: [code('"Product"'), code("quickview_tracking"), code("add_to_cart_tracking")], gap: viewsTracked ? undefined : "Views not tracked yet" }}
    >
      {rows.length === 0 ? (
        <EmptyState title="No product activity this week" text="Products show up here once people open their quick view or add them to the cart." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="t heat" style={{ margin: "0 -20px", width: "calc(100% + 40px)" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  {COLS.map(([, l]) => (
                    <th key={l} className="r">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="inline-flex items-center gap-2.5">
                        <span className="ptile" style={{ "--h": r.h } as React.CSSProperties}>
                          {r.short}
                        </span>
                        <b className="font-[550]">{r.name}</b>
                      </span>
                      {cold.some((c) => c.id === r.id) && (
                        <span className="callout">
                          <Icon name="eyeoff" size="sm" /> Viewed a lot, rarely added to cart
                        </span>
                      )}
                    </td>
                    {COLS.map(([k]) => {
                      const [a, b] = range(k);
                      const v = value(r, k);
                      const t = Number.isFinite(v) ? (v - a) / (b - a || 1) : 0;
                      return (
                        <td key={k} className="h">
                          <Tooltip content={`${r.name}: ${label(k, v)}`}>
                            <span style={{ "--hc": heat(t) } as React.CSSProperties}>{label(k, v)}</span>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cold.length > 0 && (
            <div>
              <Insight cold={cold.map((c) => ({ ...c, rate: addRate(c) }))} overall={overallRate(list)} total={list.length} />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function Insight({ cold, overall, total }: { cold: { name: string; views: number; rate: number }[]; overall: number; total: number }) {
  const names = cold.map((c) => NOTES[c.name]?.[0] ?? c.name);
  const advice = cold.map((c) => NOTES[c.name]?.[1] ?? `${c.name}’s product page`);
  const and = (a: string[]) => a.join(" and ");
  return (
    <div className="insight">
      <Icon name="info" />
      <div>
        {cold.map((c, i) => (
          <span key={c.name}>
            {i > 0 && " and "}
            <b>{names[i]}</b>
          </span>
        ))}{" "}
        get lots of views ({and(cold.map((c) => fmt(c.views)))}) but only {and(cold.map((c) => pct(c.rate)))} of viewers add {cold.length > 1 ? "them" : "it"} to cart, vs {pct(overall)} across all {total === 5 ? "five" : total}. Worth checking {and(advice)}.
      </div>
    </div>
  );
}

export async function FunnelCard() {
  const { qv } = await products();
  // The store doesn't record who saw the Quick View button, so the funnel starts at "Opened quick view".
  const steps = [
    ["Opened quick view", "quickview_tracking", qv.opened],
    ["Added to cart", "quick_view_cart_events", qv.add],
  ] as const;
  const first = steps[0][2];
  const share = (n: number) => (first > 0 ? (n / first) * 100 : NaN);
  const drops = [1].map((i) => ({ i, lost: steps[i - 1][2] - steps[i][2], conv: steps[i - 1][2] > 0 ? (steps[i][2] / steps[i - 1][2]) * 100 : NaN }));
  const biggest = drops.reduce((a, b) => (a.lost >= b.lost ? a : b));
  const flows = [3, 1];
  return (
    <Card title="Quick view funnel" subtitle="People this week, each step as a share of the one before" source={{ tables: [code("quickview_tracking"), code("quick_view_cart_events")], gap: "Button views not tracked yet" }} delay={80}>
      {first <= 0 ? (
        <EmptyState title="No quick view activity yet" text="The funnel fills in as people open the quick view." />
      ) : (
        <div className="funnel">
          {steps.map(([l, s, v], i) => {
            const d = drops.find((x) => x.i === i);
            const w = share(v);
            return (
              <div key={l} className="contents">
                {d && (
                  <div className={`fdrop ${d === biggest && d.lost > 0 ? "big" : ""}`}>
                    <div>
                      <span className="arrow" />
                    </div>
                    <div>
                      {[0, 0.6, 1.2].map((t) => (
                        <span key={t} className="fall" style={{ animationDelay: `${t}s` }} />
                      ))}
                      {d === biggest && d.lost > 0 && <Icon name="warn" size="sm" />} {pct(d.conv)} continued · {fmt(d.lost)} dropped off{d === biggest && d.lost > 0 ? " · biggest drop-off" : ""}
                    </div>
                    <div />
                  </div>
                )}
                <div className="fstep">
                  <div className="fl">
                    <b>{l}</b>
                    {s && <span>{s}</span>}
                  </div>
                  <div className="fbar">
                    <i style={{ width: `${Number.isFinite(w) ? w : 0}%`, animationDelay: `${i * 120}ms` }} />
                    {Array.from({ length: flows[i] }, (_, k) => (
                      <span
                        key={k}
                        className="flow"
                        style={{ "--w": `calc(${Number.isFinite(w) ? w : 0}% - 7px)`, animationDuration: `${2.4 + i * 0.4}s`, animationDelay: `${((k * (2.4 + i * 0.4)) / flows[i]).toFixed(2)}s` } as React.CSSProperties}
                      />
                    ))}
                  </div>
                  <div className="fv">
                    {fmt(v)}
                    <span>{pct(w)} of start</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function Bars({ items, swatch, total }: { items: readonly (CategoryCount | ColourCount)[]; swatch?: boolean; total: number }) {
  const top = items[0]?.[1] ?? 0;
  if (!items.length) return <EmptyState title="Nothing here yet" text="This fills in as people add products to their cart." />;
  return (
    <div className="flex flex-col gap-[7px]">
      {items.map((it, i) => {
        const [l, n] = it;
        const hex = it.length === 3 ? it[2] : undefined;
        return (
          <div key={l} className="grid grid-cols-[90px_minmax(0,1fr)_44px] items-center gap-2.5 text-[12.5px]">
            <span className="inline-flex items-center gap-2 text-text3">
              {swatch && hex && <span className="swatch" style={{ background: hex }} />}
              {l}
            </span>
            <div className="h-3.5 overflow-hidden rounded bg-card2">
              <i className={`grow-x block h-full rounded ${i === 0 ? "bg-c2" : "bg-text3"}`} style={{ width: `${top > 0 ? (n / top) * 100 : 0}%`, animationDelay: `${i * 60}ms` }} />
            </div>
            <b className="text-right font-semibold tabular-nums">{pct(total > 0 ? (n / total) * 100 : NaN, 0)}</b>
          </div>
        );
      })}
    </div>
  );
}

export async function CategoriesCard() {
  const { cats } = await products();
  const total = sum(cats.map(([, n]) => n));
  return (
    <Card title="Popular categories" subtitle={`Share of ${fmt(total)} add-to-carts`} source={{ tables: [code("add_to_cart_tracking"), code('"Product"'), code('"Category"')] }} delay={140}>
      <Bars items={cats} total={total} />
    </Card>
  );
}

export async function ColoursCard() {
  const { colours } = await products();
  const total = sum((await products()).cats.map(([, n]) => n));
  return (
    <Card title="Popular colours" subtitle={`Share of ${fmt(total)} add-to-carts`} source={{ tables: [code('add_to_cart_tracking."selectedColor"')] }} delay={140}>
      <Bars items={colours} swatch total={total} />
    </Card>
  );
}

export function NotTrackedNote() {
  return (
    <div className="warnbar fade">
      <Icon name="info" />
      <span>
        Product <b>views</b> and <b>quick view button views</b> aren’t tracked in your database yet, so they aren’t shown. Quick views and add-to-carts come from your tables.
      </span>
    </div>
  );
}

