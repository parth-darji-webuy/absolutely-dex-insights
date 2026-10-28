"use client";

import { type ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { useDialog } from "@/hooks/useDialog";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
};

/** A centred dialog over a dimmed page. Escape or a click outside closes it. */
export function Modal({ open, onClose, title, subtitle, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, open, onClose);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-scrim px-4 py-[5vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Dialog"}
        className="pop-in w-[min(1100px,100%)] rounded-2xl border border-border2 bg-card shadow-pop"
      >
        <div className="flex items-start justify-between gap-3 rounded-t-2xl border-b border-border px-5 py-[18px]">
          <div>
            <h3 className="text-base font-semibold tracking-[-.01em]">{title}</h3>
            {subtitle && <p className="mt-[3px] text-[12.5px] text-text3">{subtitle}</p>}
          </div>
          <Button variant="ghost" iconOnly aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
