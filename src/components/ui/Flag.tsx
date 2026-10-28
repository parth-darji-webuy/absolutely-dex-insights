import { cn } from "@/lib/cn";

/** A feature flag's name, in the small grey pill the prototype uses. */
export function Flag({ children, className, title = "Feature flag" }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <code title={title} className={cn("rounded-md border border-border bg-card2 px-[7px] py-0.5 text-text2", className)}>
      {children}
    </code>
  );
}
