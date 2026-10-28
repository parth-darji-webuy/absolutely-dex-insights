import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ConversionCard, LiftCard, PeoplePerDayCard, RaceCard } from "@/components/experiments/DetailCards";
import { ExplainButton } from "@/components/experiments/ExplainDrawer";
import { TrafficLine } from "@/components/experiments/TrafficLine";
import { VariantCard } from "@/components/experiments/VariantCard";
import { VerdictCard } from "@/components/experiments/VerdictCard";
import { Flag } from "@/components/ui/Flag";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmt } from "@/lib/format";
import { experiment } from "@/lib/queries";

type Props = { params: Promise<{ key: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = await experiment((await params).key);
  return { title: e ? e.name : "Experiment not found" };
}

export default async function Page({ params }: Props) {
  const e = await experiment((await params).key);
  if (!e) notFound();

  const thin = e.status === "Running" && e.progress < 50;
  return (
    <>
      <div className="fade">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-text3">
          <Link href="/experiments" className="hover:text-text">
            Experiments
          </Link>
          <Icon name="chevR" size="sm" />
          <span>{e.name}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="mt-1.5 text-[22px] font-semibold tracking-[-.02em]">{e.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-text2">
              <StatusBadge status={e.status} />
              <Flag title="Experiment key">{e.key}</Flag>
              <span>{e.desc}</span>
              {e.days > 0 && (
                <span className="text-text3">
                  · {e.days} days · since {e.start}
                </span>
              )}
            </div>
          </div>
          <ExplainButton e={e} />
        </div>
      </div>

      {thin && (
        <div className="fade flex items-center gap-2.5 rounded-[10px] border border-amber-border bg-amber-soft px-3.5 py-[9px] text-[13px] font-medium text-amber">
          <Icon name="info" />
          <span className="text-text">
            Not enough people yet for a reliable answer: {fmt(e.people)} of ~{fmt(e.needed)} people needed ({e.progress}%).
          </span>
        </div>
      )}

      <VerdictCard e={e} />
      <TrafficLine e={e} />
      <div className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
        <VariantCard e={e} side="c" />
        <VariantCard e={e} side="t" />
      </div>
      <RaceCard e={e} />
      <ConversionCard e={e} />
      <div className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
        <LiftCard e={e} />
        <PeoplePerDayCard e={e} />
      </div>
    </>
  );
}
