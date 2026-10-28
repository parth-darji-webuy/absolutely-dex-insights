import { type ReactNode, Suspense } from "react";
import { Card } from "./Card";
import { CardBoundary } from "./CardBoundary";
import type { SkeletonKind } from "./Skeleton";

type CardSlotProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  skeleton?: SkeletonKind;
  delay?: number;
  className?: string;
  /** What to show while loading, if not the standard grey card. */
  fallback?: ReactNode;
  /** An async Server Component that fetches its own data and renders the finished card. */
  children: ReactNode;
};

/**
 * One card's place on a page. Shows grey placeholders while the card's data loads, and an error
 * with Retry on this card only if loading or drawing it fails.
 */
export function CardSlot({ title, subtitle, skeleton = "chart", delay, className, fallback, children }: CardSlotProps) {
  return (
    <CardBoundary title={title} subtitle={subtitle} className={className}>
      <Suspense fallback={fallback ?? <Card title={title} subtitle={subtitle} loading skeleton={skeleton} delay={delay} className={className} />}>{children}</Suspense>
    </CardBoundary>
  );
}
