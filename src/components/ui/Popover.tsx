"use client";

import { type ReactNode, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TriggerProps = {
  ref: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": "dialog";
};

type PopoverProps = {
  /** Renders the element that opens the popover; spread `props` onto a button. */
  trigger: (props: TriggerProps, open: boolean) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  width?: number;
  label?: string;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** A small panel under its trigger. Closes on outside click, Escape, resize and scroll. */
export function Popover({ trigger, children, width = 260, label = "Menu" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    const a = anchor.current;
    const p = panel.current;
    if (!open || !a || !p) return;
    const r = a.getBoundingClientRect();
    let left = r.right - width;
    if (left < 8) left = r.left;
    left = clamp(left, 8, window.innerWidth - width - 8);
    let top = r.bottom + 6;
    if (top + p.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - p.offsetHeight - 6);
    p.style.left = left + "px";
    p.style.top = top + "px";
  }, [open, width]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !anchor.current?.contains(t)) close();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        anchor.current?.focus();
      }
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open, close]);

  return (
    <>
      {trigger({ ref: anchor, onClick: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": "dialog" }, open)}
      {open &&
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-label={label}
            className="pop-in fixed z-[120] min-w-[200px] rounded-xl border border-border2 bg-card shadow-pop"
            style={{ width }}
          >
            {typeof children === "function" ? children(close) : children}
          </div>,
          document.body,
        )}
    </>
  );
}
