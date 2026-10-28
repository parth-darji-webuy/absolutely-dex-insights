import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

/** Stands in for a page whose content is built in a later phase. */
export function ComingSoon() {
  return (
    <Card>
      <EmptyState title="This page is coming soon" text="The sidebar, header and search already work. The content for this page is built in a later phase." />
    </Card>
  );
}
