import type { EventMeta, EventType } from "@/types";

/** "Saw an experiment" with its coloured dot. */
export function EventName({ type, meta, className = "" }: { type: EventType; meta: Record<EventType, EventMeta>; className?: string }) {
  const m = meta[type];
  return (
    <span className={`ev ${className}`} style={{ "--c": m?.c ?? "var(--text3)", fontFamily: "var(--font-sans)" } as React.CSSProperties}>
      <i />
      {m?.label ?? type}
    </span>
  );
}
