"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

/**
 * "Couldn't load this" with a Retry button. Without `onRetry` it asks the server for fresh data
 * (router.refresh), so it works when rendered from a Server Component.
 */
export function CardError({ message = "Couldn’t load this card.", onRetry }: { message?: string; onRetry?: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <EmptyState
      title="Something went wrong"
      text={message}
      action={
        <Button
          disabled={pending}
          onClick={() => (onRetry ? onRetry() : start(() => router.refresh()))}
        >
          {pending ? "Retrying…" : "Retry"}
        </Button>
      }
    />
  );
}
