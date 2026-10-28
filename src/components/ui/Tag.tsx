import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TagTone = "default" | "ai" | "lead" | "ok" | "warn" | "bad" | "plain";

const TONE: Record<TagTone, string> = {
  default: "border-border2 bg-card2 text-text2",
  ai: "border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-accent-soft text-accent-text",
  lead: "relative overflow-hidden border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-accent-soft text-accent-text after:absolute after:inset-0 after:-translate-x-[120%] after:animate-[sheen_4s_ease-in-out_infinite] after:bg-[linear-gradient(100deg,transparent_30%,rgba(255,255,255,.7)_50%,transparent_70%)] after:content-['']",
  ok: "border-[color-mix(in_srgb,var(--green)_30%,transparent)] bg-green-soft text-green",
  warn: "border-amber-border bg-amber-soft text-amber",
  bad: "border-[color-mix(in_srgb,var(--red)_30%,transparent)] bg-red-soft text-red",
  plain: "border-border2 bg-transparent text-text2",
};

export function Tag({ tone = "default", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-[5px] rounded-md border px-2 text-[11.5px] font-[550] whitespace-nowrap",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
