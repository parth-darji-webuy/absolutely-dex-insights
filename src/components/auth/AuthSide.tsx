"use client";

import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { AuthScene } from "./AuthScene";
import { AUTH_LINES } from "./scene-data";

const ROTATE_MS = 3400;

/** The purple panel: title, a rotating line with dots, floating cards, and a light that follows the pointer. */
export function AuthSide() {
  const side = useRef<HTMLElement>(null);
  const [line, setLine] = useState(0);
  const [stamp, setStamp] = useState(0);

  // Rotate the line every few seconds; picking a dot restarts the wait.
  useEffect(() => {
    const t = setTimeout(() => setLine((l) => (l + 1) % AUTH_LINES.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [line, stamp]);

  // Soft light and slight parallax follow the pointer (not for reduced motion).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMove = (e: PointerEvent) => {
      const el = side.current;
      if (!el || mq.matches) return;
      const r = el.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      const x = inside ? (e.clientX - r.left) / r.width - 0.5 : 0;
      const y = inside ? (e.clientY - r.top) / r.height - 0.5 : 0;
      el.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%");
      el.style.setProperty("--my", ((y + 0.5) * 100).toFixed(1) + "%");
      el.classList.toggle("lit", inside);
      el.querySelectorAll<HTMLElement>(".ac").forEach((c) => {
        const d = Number(c.dataset.depth);
        c.style.transform = `translate(${(-x * d).toFixed(1)}px,${(-y * d).toFixed(1)}px) rotateX(${(y * 8).toFixed(2)}deg) rotateY(${(-x * 8).toFixed(2)}deg)`;
      });
    };
    document.addEventListener("pointermove", onMove);
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <aside ref={side} className="auth-side">
      <div className="auth-glow" />
      <div className="auth-copy">
        <h1>
          Welcome back to
          <br />
          AbsolutelyDeX Insights!
        </h1>
        <p className="auth-rot">
          <span key={line}>{AUTH_LINES[line]}</span>
        </p>
        <div className="auth-dots">
          {AUTH_LINES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === line ? "on" : ""}
              aria-label={`Message ${i + 1} of ${AUTH_LINES.length}`}
              aria-current={i === line}
              onClick={() => {
                setLine(i);
                setStamp((s) => s + 1);
              }}
            />
          ))}
        </div>
      </div>
      <AuthScene />
      <div className="auth-foot">
        <BrandMark variant="white" />
      </div>
    </aside>
  );
}
