import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  on?: boolean;
  /** A count shown after the label. */
  n?: number | string;
};

export function Chip({ on, n, className, children, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={on}
      className={cn(
        "inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium whitespace-nowrap transition-all duration-150",
        on
          ? "border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-accent-soft text-accent-text"
          : "border-border bg-card text-text2 hover:border-border2 hover:text-text",
        className,
      )}
      {...props}
    >
      {children}
      {n !== undefined && <span className="font-medium text-text3">{n}</span>}
    </button>
  );
}
