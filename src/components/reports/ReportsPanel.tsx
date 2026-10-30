"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { periodSummary, type PeriodSummary } from "@/app/(app)/reports/actions";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { daysBetween, niceDate, type PresetKey, parseYMD, presetRange, rangeError, ymd } from "@/lib/dates";
import { fmt } from "@/lib/format";
import { downloadBlob } from "@/lib/report";

export type ReportExperiment = { key: string; name: string; flag: string; metricShort: string; mtable: string; status: string; start: string };

const PRESETS: [PresetKey, string][] = [
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
  ["thisMonth", "This month"],
  ["lastMonth", "Last month"],
];

/** The Period card and the Experiment reports card. One period and one experiment choice for every download. */
export function ReportsPanel({ experiments, today, trackingStart }: { experiments: ReportExperiment[]; /** Today in the store's time zone, YYYY-MM-DD. */ today: string; /** TRACKING_START, YYYY-MM-DD. */ trackingStart: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const todayDate = parseYMD(today) ?? new Date();
  const startDate = parseYMD(trackingStart) ?? todayDate;
  const [preset, setPreset] = useState<PresetKey | "custom">("7d");
  const [range, setRange] = useState<[Date | null, Date | null]>(() => presetRange("7d", todayDate) ?? [null, null]);
  const [exp, setExp] = useState("all");
  const [loaded, setLoaded] = useState<{ id: string; data: Record<string, PeriodSummary> } | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const latest = useRef(0);

  const [from, to] = range;
  const err = rangeError(from, to, todayDate, startDate);
  const n = from && to ? daysBetween(from, to) : 0;
  const shown = experiments.filter((e) => exp === "all" || e.key === exp);
  const fromStr = from ? ymd(from) : "";
  const toStr = to ? ymd(to) : "";
  const keys = shown.map((e) => e.key).join(",");
  const askId = `${keys}|${fromStr}|${toStr}`;
  const summary = loaded?.id === askId ? loaded.data : null;
  const failed = failedId === askId;

  // Ask the server how much data the period holds, and ignore answers that arrive late.
  useEffect(() => {
    if (err || !keys) return;
    const id = ++latest.current;
    periodSummary(keys.split(","), fromStr, toStr)
      .then((data) => id === latest.current && setLoaded({ id: askId, data }))
      .catch(() => id === latest.current && setFailedId(askId));
  }, [keys, fromStr, toStr, err, askId]);

  const pick = (k: PresetKey) => {
    setPreset(k);
    setRange(presetRange(k, todayDate) ?? [null, null]);
  };
  const setDate = (which: 0 | 1, value: string) => {
    setPreset("custom");
    setRange((r) => (which === 0 ? [parseYMD(value), r[1]] : [r[0], parseYMD(value)]));
  };

  // The file comes from the server, which checks the period again with the same rules.
  const download = async (e: ReportExperiment) => {
    if (err || !from || !to || busy) return;
    setBusy(e.key);
    try {
      const res = await fetch(`/api/reports/experiment?${new URLSearchParams({ key: e.key, from: ymd(from), to: ymd(to) })}`, { cache: "no-store" });
      if (res.status === 401) return router.push("/sign-in");
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        toast(res.status === 404 ? `${e.name} · daily results: ${(error ?? "nothing in this period").replace(/^Not/, "not")}` : (error ?? "The download didn’t work. Try again."), res.status === 404 ? "info" : "warn");
        return;
      }
      const name = decodeURIComponent(res.headers.get("X-Report-Name") ?? `${e.name} · daily results`);
      const file = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? `absolutelydex_${e.key}-daily_${ymd(from)}_to_${ymd(to)}.csv`;
      downloadBlob(file, await res.blob());
      toast(`${name}: ${fmt(Number(res.headers.get("X-Report-Rows") ?? 0))} rows downloaded`);
    } catch {
      toast("The download didn’t work. Try again.", "warn");
    } finally {
      setBusy(null);
    }
  };

  const min = trackingStart;
  const max = today;

  const inPeriod = (e: ReportExperiment) => {
    if (err) return { text: <span className="text-text3">—</span>, days: 0 };
    const s = summary?.[e.key];
    if (failed) return { text: <span className="text-text3">Couldn’t load</span>, days: 0 };
    if (!s) return { text: <Skeleton w="96px" h={12} />, days: 0, loading: true };
    if (s.days === 0) return { text: <span className="text-text3">Not running in this period</span>, days: 0 };
    return {
      text: (
        <>
          <b>{fmt(s.people)}</b> people
          <div className="text-xs text-text3">
            {s.days} day{s.days > 1 ? "s" : ""} · {s.rows} rows
          </div>
        </>
      ),
      days: s.days,
    };
  };

  return (
    <>
      <section className="card pbar fade rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,.04)]">
        <div className="pbar-h">
          <b>Period and experiment</b>
          <span>Used by every download below</span>
        </div>
        <div className="pbar-b">
          <label className="pbar-exp">
            Experiment
            <select className="input" value={exp} onChange={(e) => setExp(e.target.value)}>
              <option value="all">All experiments</option>
              {experiments.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <div className="pbar-presets">
            {PRESETS.map(([k, l]) => (
              <Chip key={k} on={preset === k} onClick={() => pick(k)}>
                {l}
              </Chip>
            ))}
          </div>
          <div className="pbar-dates">
            <label>
              From
              <input type="date" className={`input ${err ? "bad" : ""}`} value={fromStr} min={min} max={max} aria-invalid={!!err} onChange={(e) => setDate(0, e.target.value)} />
            </label>
            <label>
              To
              <input type="date" className={`input ${err ? "bad" : ""}`} value={toStr} min={min} max={max} aria-invalid={!!err} onChange={(e) => setDate(1, e.target.value)} />
            </label>
          </div>
          <span className={`pbar-sum ${err ? "bad" : ""}`} role="status">
            {err || (from && to ? `${niceDate(from)} – ${niceDate(to)} · ${n} day${n > 1 ? "s" : ""}` : "")}
          </span>
        </div>
      </section>

      <Card title="Experiment reports" subtitle={`${shown.length} experiment${shown.length === 1 ? "" : "s"} · one row per day, per variant`} delay={60}>
        <div className="table-wrap">
          <table className="t" style={{ margin: "0 -20px", width: "calc(100% + 40px)" }}>
            <thead>
              <tr>
                <th>Report</th>
                <th>Status</th>
                <th>Running since</th>
                <th>In this period</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => {
                const p = inPeriod(e);
                return (
                  <tr key={e.key}>
                    <td>
                      <span className="inline-flex items-center gap-3 whitespace-normal">
                        <span className="grid size-[34px] flex-none place-items-center rounded-[10px] border border-border bg-card2 text-text2">
                          <Icon name="flask" />
                        </span>
                        <b className="font-[550]">{e.name}</b>
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="text-text2">{niceDate(new Date(e.start))}</td>
                    <td className="tabular-nums">{p.text}</td>
                    <td className="text-right">
                      <Button variant="primary" size="sm" disabled={!p.days || !!err || !!busy} onClick={() => download(e)} aria-label={`Download CSV for ${e.name}`}>
                        <Icon name="download" size="sm" /> {busy === e.key ? "Preparing…" : "Download CSV"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-text3">
                    No experiments to report on yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
