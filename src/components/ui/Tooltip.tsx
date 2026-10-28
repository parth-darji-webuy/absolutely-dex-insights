"use client";

import { createContext, type ReactNode, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from "react";

type TipApi = {
  show: (content: ReactNode, x: number, y: number) => void;
  hide: () => void;
};

const TipContext = createContext<TipApi | null>(null);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** One floating tip for the whole app. Charts and `<Tooltip>` both use it. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<{ content: ReactNode; x: number; y: number; show: boolean }>({ content: null, x: 0, y: 0, show: false });
  const ref = useRef<HTMLDivElement>(null);

  const show = useCallback((content: ReactNode, x: number, y: number) => setTip({ content, x, y, show: true }), []);
  const hide = useCallback(() => setTip((t) => (t.show ? { ...t, show: false } : t)), []);
  const api = useMemo(() => ({ show, hide }), [show, hide]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !tip.show) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    el.style.left = clamp(tip.x + 14, 8, window.innerWidth - w - 8) + "px";
    el.style.top = clamp(tip.y - h - 12, 8, window.innerHeight - h - 8) + "px";
  }, [tip]);

  return (
    <TipContext value={api}>
      {children}
      <div
        ref={ref}
        role="tooltip"
        className={`pointer-events-none fixed z-[200] min-w-[150px] rounded-[9px] border border-border2 bg-card px-[11px] py-[9px] text-xs tabular-nums shadow-pop transition-[opacity,transform] duration-[120ms] ${tip.show ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
      >
        {tip.content}
      </div>
    </TipContext>
  );
}

const NOOP: TipApi = { show: () => {}, hide: () => {} };
export const useTip = (): TipApi => useContext(TipContext) ?? NOOP;

/** Mouse and keyboard handlers that show `content` in the shared tip. */
export function useTipProps(content: ReactNode) {
  const tip = useTip();
  return {
    onMouseMove: (e: React.MouseEvent) => tip.show(content, e.clientX, e.clientY),
    onMouseLeave: tip.hide,
    onFocus: (e: React.FocusEvent<Element>) => {
      const r = e.currentTarget.getBoundingClientRect();
      tip.show(content, r.left + r.width / 2, r.top);
    },
    onBlur: tip.hide,
  };
}

/** Wraps anything that should explain itself on hover or focus. */
export function Tooltip({ content, children, className }: { content: ReactNode; children: ReactNode; className?: string }) {
  const props = useTipProps(content);
  return (
    <span className={className} {...props}>
      {children}
    </span>
  );
}

/** Rows used inside a chart tip: a heading, then coloured label/value rows. */
export function TipHead({ children }: { children: ReactNode }) {
  return <div className="mb-[5px] font-semibold text-text">{children}</div>;
}

export function TipRow({ color, label, value, total }: { color?: string; label: ReactNode; value: ReactNode; total?: boolean }) {
  return (
    <div className={`flex items-center gap-2 leading-[1.7] text-text2 ${total ? "mt-[5px] border-t border-border pt-[5px]" : ""}`}>
      {color && <i className="size-2 flex-none rounded-[2px]" style={{ background: color }} />}
      {label}
      <b className="ml-auto pl-3 font-semibold text-text">{value}</b>
    </div>
  );
}
