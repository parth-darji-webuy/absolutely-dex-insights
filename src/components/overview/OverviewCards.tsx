import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getStoreLast30 } from "@/lib/data";
import { ago, fmt, pct } from "@/lib/format";
import { experiments, overview, products as getProducts } from "@/lib/queries";
import { sum } from "@/lib/rng";
import type { EventType } from "@/types";
import { ActivityChart } from "./ActivityChart";
import { AllTables } from "./AllTables";
import { StoreLast30Card } from "./StoreLast30Card";

export async function StoreCard() {
  const [store, exps] = await Promise.all([getStoreLast30(), experiments()]);
  return <StoreLast30Card initial={store} experiments={exps} />;
}

export async function ActivityCard() {
  const o = await overview();
  const keys = Object.keys(o.daily) as EventType[];
  const series = keys.map((k) => ({ key: k, name: o.eventMeta[k].label, color: o.eventMeta[k].c, values: o.daily[k] }));
  const last = o.days.at(-1)?.split(" ").pop();
  const range = o.days.length ? `${o.days[0]}${o.days.length > 1 && last ? ` – ${last}` : ""}` : "";
  return (
    <Card title="Activity over time" subtitle={`Events per day, stacked by type${range ? ` · ${range}` : ""}`} source={{ tables: [<AllTables key="all" />] }} delay={100}>
      {o.days.length === 0 || keys.every((k) => sum(o.daily[k]) === 0) ? (
        <EmptyState title="No activity in these days" text={o.lastActivity ? `The store has recorded nothing in the last ${o.days.length || 7} days. The latest activity was ${ago(o.lastActivity)}.` : "Events will show up here as soon as people visit the store."} />
      ) : (
        <ActivityChart labels={o.days} series={series} />
      )}
    </Card>
  );
}

export async function TopProductsCard() {
  const [o, { products }] = await Promise.all([overview(), getProducts()]);
  const total = sum(o.addToCarts);
  const rows = [...products].sort((a, b) => b.atc - a.atc);
  const top = rows[0]?.atc ?? 0;
  return (
    <Card
      title="Top products"
      subtitle="By add to cart this week"
      source={{ tables: ["add_to_cart_tracking", '"Product"'] }}
      delay={150}
      actions={
        <Link href="/products" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-text hover:underline hover:underline-offset-[3px]">
          View all <Icon name="chevR" size="sm" />
        </Link>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No products yet" text="Products people add to their cart will be ranked here." />
      ) : (
        <div className="flex flex-col">
          {rows.map((p, i) => (
            <div key={p.id} className="grid grid-cols-[18px_34px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-[9px] last:border-b-0">
              <span className="text-xs text-text3 tabular-nums">{i + 1}</span>
              <span
                className="grid size-[34px] place-items-center rounded-[9px] border text-[11px] font-[650] tracking-[.02em]"
                style={{ color: `hsl(${p.h} 50% 38%)`, background: `hsl(${p.h} 60% 50% / .10)`, borderColor: `hsl(${p.h} 45% 55% / .22)` }}
              >
                {p.short}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{p.name}</div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-[2px] bg-card2">
                  <i className="grow-x block h-full rounded-[2px] bg-text3" style={{ width: `${top > 0 ? (p.atc / top) * 100 : 0}%`, animationDelay: `${i * 70}ms` }} />
                </div>
              </div>
              <div className="text-right font-semibold tabular-nums">
                {fmt(p.atc)}
                <span className="block text-[11px] font-medium text-text3">{total > 0 ? pct((p.atc / total) * 100, 0) : "—"} of total</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
