"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Experiment } from "@/types";
import { ExperimentCard } from "./ExperimentCard";

/** Status chips with counts, and one card per test that matches the chosen status. */
export function ExperimentList({ experiments }: { experiments: Experiment[] }) {
  const [filter, setFilter] = useState("all");
  const counts = new Map<string, number>();
  for (const e of experiments) counts.set(e.status, (counts.get(e.status) ?? 0) + 1);
  const list = experiments.filter((e) => filter === "all" || e.status === filter);

  return (
    <>
      <div className="fade flex flex-wrap items-center gap-2">
        <Chip on={filter === "all"} n={experiments.length} onClick={() => setFilter("all")}>
          All
        </Chip>
        {[...counts].map(([status, n]) => (
          <Chip key={status} on={filter === status} n={n} onClick={() => setFilter(status)}>
            {status}
          </Chip>
        ))}
      </div>
      {experiments.length === 0 ? (
        <Card>
          <EmptyState title="No experiments yet" text="Tests from GrowthBook will show up here." />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState title="No experiments with this status" text="Pick another filter above." />
        </Card>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 max-[560px]:grid-cols-1">
          {list.map((e, i) => (
            <ExperimentCard key={e.key} e={e} delay={i * 50} />
          ))}
        </div>
      )}
    </>
  );
}
