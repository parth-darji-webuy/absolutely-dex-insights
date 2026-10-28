import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CardError } from "./CardError";
import { SkeletonStack, type SkeletonKind } from "./Skeleton";
import { Source } from "./Source";

export type CardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Buttons or chips shown at the top right. */
  actions?: ReactNode;
  /** Tables (or other bits) that feed the card, shown as a Source line. */
  source?: { tables: ReactNode[]; gap?: string };
  /** Shows grey placeholders shaped like `skeleton` instead of the content. */
  loading?: boolean;
  skeleton?: SkeletonKind;
  /** When set, shows this message with a Retry button instead of the content. */
  error?: string | null;
  /** Only for cards rendered from a Client Component; Server Components get a page refresh. */
  onRetry?: () => void;
  /** Animation delay in ms. */
  delay?: number;
  /** Less padding above the body, for charts that run edge to edge. */
  flush?: boolean;
  id?: string;
  className?: string;
  bodyClassName?: string;
  children?: ReactNode;
};

export function Card({ title, subtitle, actions, source, loading, skeleton = "list", error, onRetry, delay = 0, flush, id, className, bodyClassName, children }: CardProps) {
  const ready = !loading && !error;
  return (
    <section
      id={id}
      className={cn("fade min-w-0 rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-[transform,box-shadow,border-color] duration-200", className)}
      style={{ "--d": `${delay}ms` } as CSSProperties}
    >
      {title && (
        <div className="flex items-start justify-between gap-3 px-5 pt-[18px]">
          <div>
            <h3 className="text-sm font-semibold tracking-[-.005em]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-text3">{subtitle}</p>}
          </div>
          {ready && actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(flush && ready ? "px-0 pt-3 pb-0" : "px-5 pt-4 pb-5", bodyClassName)}>
        {error ? <CardError message={error} onRetry={onRetry} /> : loading ? <SkeletonStack kind={skeleton} /> : children}
        {ready && source && <Source {...source} />}
      </div>
    </section>
  );
}
