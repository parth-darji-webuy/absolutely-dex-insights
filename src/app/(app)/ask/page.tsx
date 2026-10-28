import type { Metadata } from "next";
import { AskPanel } from "@/components/ask/AskPanel";
import { PageHeading } from "@/components/shell/PageHeading";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SUGGESTIONS } from "@/lib/ask/suggestions";
import { getEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Ask your data" };

export default async function Page({ searchParams }: PageProps<"/ask">) {
  if (getEnv().AI_PROVIDER === "none") {
    return (
      <>
        <PageHeading page="ask" />
        <Card>
          <EmptyState title="Ask your data is switched off" text="Answers from the AI are turned off for this app. The rest of Insights works as normal." />
        </Card>
      </>
    );
  }
  const { q } = await searchParams;
  const question = (Array.isArray(q) ? q[0] : q)?.slice(0, 300);
  return (
    <>
      <PageHeading page="ask" />
      <AskPanel suggestions={SUGGESTIONS} initialQuestion={question} />
    </>
  );
}
