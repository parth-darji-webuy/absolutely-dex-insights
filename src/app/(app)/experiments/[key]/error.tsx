"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

// The test's data couldn't be loaded. Retry asks the server again.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <Card
      title="This experiment"
      error="We couldn’t load this experiment. The rest of the app still works."
      onRetry={() =>
        startTransition(() => {
          router.refresh();
          reset();
        })
      }
    />
  );
}
