import { cn } from "@/lib/cn";

/** A dot and a word: green while the test is running, grey otherwise. */
export function StatusBadge({ status }: { status: string }) {
  const running = status.toLowerCase() === "running";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-[550] text-text2">
      <i className={cn("size-[7px] rounded-full", running ? "bg-green" : "bg-text3")} />
      {status}
    </span>
  );
}
