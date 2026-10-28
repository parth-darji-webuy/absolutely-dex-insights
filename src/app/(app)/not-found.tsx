import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClasses } from "@/components/ui/button-styles";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        title="Page not found"
        text="That link doesn’t go anywhere. Use the sidebar to get back."
        action={
          <Link href="/overview" className={buttonClasses("primary")}>
            Go to Overview
          </Link>
        }
      />
    </Card>
  );
}
