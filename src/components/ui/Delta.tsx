import { cn } from "@/lib/cn";

type DeltaProps = {
  /** Change as a number (e.g. 7.4). Null or NaN, when there is nothing to compare, shows "—". */
  value: number | null | undefined;
  unit?: string;
  /** Text after the number, e.g. "vs last week". Pass "" for none. */
  label?: string;
};

export function Delta({ value, unit = "%", label = "vs last week" }: DeltaProps) {
  const known = typeof value === "number" && Number.isFinite(value);
  const tone = !known ? "flat" : value > 0.05 ? "up" : value < -0.05 ? "down" : "flat";
  const arrow = tone === "up" ? "▲" : tone === "down" ? "▼" : "•";
  const text = !known ? "—" : tone === "flat" ? "No change" : `${arrow} ${Math.abs(value).toFixed(1)}${unit}`;
  return (
    <>
      <span
        className={cn(
          "inline-flex items-center gap-[3px] text-xs font-semibold tabular-nums",
          tone === "up" && "text-green",
          tone === "down" && "text-red",
          tone === "flat" && "text-text2",
        )}
      >
        {text}
      </span>
      {label && <span>{label}</span>}
    </>
  );
}
