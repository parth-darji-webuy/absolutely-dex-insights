"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Person } from "@/components/people/Person";
import { lookOf } from "@/components/people/look";
import { fmt, pct } from "@/lib/format";
import { SCENE } from "./scene-data";

const W = 204;
const H = 40;

function TrendLine() {
  const { days } = SCENE.trend;
  const mn = Math.min(...days);
  const mx = Math.max(...days);
  const pts = days.map((v, i) => [(i * W) / (days.length - 1), H - 5 - ((H - 10) * (v - mn)) / (mx - mn || 1)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  return (
    <svg className="ac-spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path className="rise" d={`${line}L${W},${H}L0,${H}Z`} fill="rgba(255,255,255,.12)" />
      <path className="draw" pathLength={1} d={line} fill="none" stroke="#fff" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle className="popin" style={{ animationDelay: "1s" }} cx={W - 1.5} cy={pts[pts.length - 1][1]} r={3} fill="#7CF0C0" />
    </svg>
  );
}

/** Three floating preview cards. The visitor count on the middle card ticks up and down. */
export function AuthScene() {
  const { experiment: e, live, trend } = SCENE;
  const [people, setPeople] = useState<number>(live.start);
  const [bump, setBump] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const top = Math.max(e.control.rate, e.treatment.rate) * 1.15;

  useEffect(() => {
    timer.current = setInterval(() => {
      if (document.hidden || Math.random() < 0.4) return;
      setPeople((p) => Math.min(live.max, Math.max(live.min, p + (Math.random() < 0.5 ? -1 : 1))));
      setBump((b) => b + 1);
    }, 1200);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [live.max, live.min]);

  const row = (r: { label: string; rate: number }, lead?: boolean) => (
    <div className={`ac-row ${lead ? "lead" : ""}`}>
      <span>{r.label}</span>
      <div className="ac-bar">
        <i style={{ width: `${((r.rate / top) * 100).toFixed(1)}%` }} />
      </div>
      <b>{pct(r.rate)}</b>
    </div>
  );

  return (
    <div className="auth-scene">
      <div className="ac ac-exp" data-depth="26">
        <div className="ac-in">
          <div className="ac-h">
            <Icon name="flask" size="sm" /> {e.name}
          </div>
          {row(e.control)}
          {row(e.treatment, true)}
          <div className="ac-foot">{e.foot}</div>
        </div>
      </div>
      <div className="ac ac-live" data-depth="14">
        <div className="ac-in">
          <div className="ac-h">
            <span className="live-dot" /> On the site now
          </div>
          <b key={bump} className={`ac-big ${bump ? "bump" : ""}`}>
            {people}
          </b>
          <div className="ac-people">
            {live.crowd.map((id) => (
              <Person key={id} look={lookOf(id)} h={30} motion="idle" />
            ))}
            <em>+{people - 5}</em>
          </div>
        </div>
      </div>
      <div className="ac ac-trend" data-depth="18">
        <div className="ac-in">
          <div className="ac-h">{trend.title}</div>
          <div className="ac-val">
            <b>{fmt(trend.total)}</b>
            <span>{trend.change}</span>
          </div>
          <TrendLine />
        </div>
      </div>
    </div>
  );
}
