"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { refreshStore } from "@/app/(app)/overview/actions";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmt } from "@/lib/format";
import { sum } from "@/lib/rng";
import type { Experiment, StoreLast30 } from "@/types";
import { AllTables } from "./AllTables";
import { KvGrid } from "./KvGrid";
import { RunCard } from "./RunCard";
import { StoreScene } from "./StoreScene";

const EVERY_MS = 30 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "14:03 – 14:33": the `minutes` before `now`. */
const windowText = (now: number, minutes: number) => `${hm(new Date(now - minutes * 60_000))} – ${hm(new Date(now))}`;

/**
 * The "Store · last 30 minutes" card. Its Refresh button (and a refresh every 30 minutes)
 * reloads only this card.
 */
export function StoreLast30Card({ initial, experiments }: { initial: StoreLast30; experiments: Experiment[] }) {
  const [data, setData] = useState(initial);
  const [at, setAt] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      setData(await refreshStore());
      setAt(Date.now());
    } catch {
      setError("We couldn’t refresh the last 30 minutes. The rest of the page still works.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, EVERY_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const tests = experiments.filter((e) => e.status === "Running");
  const exposures = sum(tests.map((e) => (data.recent[e.key] ? data.recent[e.key].c[0] + data.recent[e.key].t[0] : 0)));
  const stamp = new Date(at);

  return (
    <Card
      title="Store · last 30 minutes"
      subtitle={
        <>
          <span suppressHydrationWarning>{windowText(at, data.minutes)}</span> · click a test to open it
        </>
      }
      source={{ tables: [<AllTables key="all" />] }}
      loading={busy}
      error={error}
      onRetry={refresh}
      skeleton="chart"
      delay={80}
      actions={
        <>
          <span className="text-xs text-text3" suppressHydrationWarning>
            Updated {pad(stamp.getHours())}:{pad(stamp.getMinutes())}:{pad(stamp.getSeconds())}
          </span>
          <Button size="sm" onClick={refresh} disabled={busy}>
            <Icon name="refresh" size="sm" /> Refresh
          </Button>
        </>
      }
    >
      <KvGrid
        className="mb-4"
        items={[
          ["Visitors · last 30 min", fmt(data.visitors)],
          ["Experiment exposures · last 30 min", fmt(exposures)],
          ["Experiments running", fmt(tests.length)],
        ]}
      />
      <StoreScene zones={data.zones} idle={data.idle} />
      {tests.length === 0 ? (
        <EmptyState title="No experiments running" text="Tests that are running will show their last 30 minutes here." />
      ) : (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {tests.map((e, i) => (
            <RunCard key={e.key} e={e} w={data.recent[e.key] ?? { c: [0, 0], t: [0, 0], mins: [] }} minutes={data.minutes} delay={i * 50} />
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-text3">
        Counts cover the 30 minutes before this page loaded. One visitor can be in several tests at once, so test counts don’t add up to visitors. Bars show people per minute.
      </p>
    </Card>
  );
}
