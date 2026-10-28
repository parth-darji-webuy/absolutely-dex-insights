"use client";

import { type ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { useDialog } from "@/hooks/useDialog";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
};

/** A panel that slides in from the right, over a dimmed page. */
export function Drawer({ open, onClose, title, subtitle, children }: DrawerProps) {
  const ref = useRef<HTMLElement>(null);
  useDialog(ref, open, onClose);
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn("fixed inset-0 z-[80] bg-scrim transition-opacity duration-200", open ? "opacity-100" : "pointer-events-none opacity-0")}
      />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Details"}
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[90] flex w-[min(520px,100vw)] flex-col border-l border-border bg-card transition-transform duration-[280ms] ease-proto",
          open ? "translate-x-0 shadow-pop" : "translate-x-[102%]",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-[18px]">
          <div>
            <h3 className="text-base font-semibold tracking-[-.01em]">{title}</h3>
            {subtitle && <p className="mt-[3px] text-[12.5px] text-text3">{subtitle}</p>}
          </div>
          <Button variant="ghost" iconOnly aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">{children}</div>
      </aside>
    </>,
    document.body,
  );
}
