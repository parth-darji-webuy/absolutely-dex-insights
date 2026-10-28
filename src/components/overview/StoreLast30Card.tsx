"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ago, clock, fmt } from "@/lib/format";
import type { Experiment, StoreLast30 } from "@/types";
import { AllTables } from "./AllTables";
import { KvGrid } from "./KvGrid";
import { RunCard } from "./RunCard";
import { StoreScene } from "./StoreScene";

const pad = (n: number) => String(n).padStart(2, "0");
const hm = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * The "Store · last N minutes" card (N = STORE_REFRESH_MINUTES). Refresh, and an automatic refresh every N
 * minutes while the tab is visible, reload only this card. A failed refresh keeps the old numbers.
 */
export function StoreLast30Card({ initial, experiments }: { initial: StoreLast30; experiments: Experiment[] }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [at, setAt] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const running = useRef(false);
  const every = initial.minutes * 60_000;

  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/store/last-30", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/sign-in");
        return;
      }
      if (!res.ok) throw new Error(`status ${res.status}`);
      setData((await res.json()) as StoreLast30);
      setAt(Date.now());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [router]);

  // Refresh on a timer, but only while the tab is on screen; catch up when it comes back after a long time away.
  const lastAt = useRef(at);
  useEffect(() => {
    lastAt.current = at;
  }, [at]);
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && refresh();
    const id = setInterval(tick, every);
    const onVisible = () => document.visibilityState === "visible" && Date.now() - lastAt.current >= every && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, every]);

  const tests = experiments.filter((e) => e.status === "Running");
  const stamp = new Date(at);
  const n = data.minutes;

  return (
    <Card
      title={`Store · last ${n} minutes`}
      subtitle={
        <>
          <span suppressHydrationWarning>{`${hm(data.from)} – ${hm(data.to)}`}</span> · click a test to open it
        </>
      }
      source={{ tables: [<AllTables key="all" />] }}
      delay={80}
      actions={
        <>
          {failed ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-red" role="alert">
              Couldn’t refresh ·{" "}
              <button type="button" className="link !text-xs !text-red" onClick={refresh} disabled={busy}>
                Retry
              </button>
            </span>
          ) : (
            <span className="text-xs text-text3" suppressHydrationWarning>
              Updated {pad(stamp.getHours())}:{pad(stamp.getMinutes())}:{pad(stamp.getSeconds())}
            </span>
          )}
          <Button size="sm" onClick={refresh} disabled={busy} aria-busy={busy}>
            {busy ? <span className="size-3.5 animate-spin rounded-full border-2 border-text3/40 border-t-text2" aria-hidden="true" /> : <Icon name="refresh" size="sm" />} Refresh
          </Button>
        </>
      }
    >
      <KvGrid
        className="mb-4"
        items={[
          [`Visitors · last ${n} min`, fmt(data.visitors)],
          [`Experiment exposures · last ${n} min`, fmt(data.exposures)],
          ["Experiments running", fmt(tests.length)],
        ]}
      />
      {data.visitors === 0 && (
        <p className="mb-3 text-[13px] text-text2" role="status" suppressHydrationWarning>
          {data.lastActivity
            ? `Quiet right now: nobody in the last ${n} minutes. The latest activity was ${ago(data.lastActivity, data.to)} (${clock(data.lastActivity)}).`
            : `Quiet right now: the store hasn’t recorded any activity yet.`}
        </p>
      )}
      <StoreScene zones={data.zones} idle={data.idle} minutes={n} />
      {tests.length === 0 ? (
        <EmptyState title="No experiments running" text={`Tests that are running will show their last ${n} minutes here.`} />
      ) : (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {tests.map((e, i) => (
            <RunCard key={e.key} e={e} w={data.recent[e.key] ?? { c: [0, 0], t: [0, 0], mins: [] }} minutes={data.minutes} delay={i * 50} />
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-text3">
        Counts cover the {n} minutes before the last refresh. One visitor can be in several tests at once, so test counts don’t add up to visitors. Bars show people per minute.
      </p>
    </Card>
  );
}
