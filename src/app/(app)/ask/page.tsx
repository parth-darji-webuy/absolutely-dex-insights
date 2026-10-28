import type { Metadata } from "next";
import { AskPanel } from "@/components/ask/AskPanel";
import { PageHeading } from "@/components/shell/PageHeading";
import { ANSWERS, SUGGESTIONS } from "@/mocks";

export const metadata: Metadata = { title: "Ask your data" };

export default async function Page({ searchParams }: PageProps<"/ask">) {
  const { q } = await searchParams;
  const question = (Array.isArray(q) ? q[0] : q)?.slice(0, 300);
  return (
    <>
      <PageHeading page="ask" />
      <AskPanel answers={ANSWERS} suggestions={SUGGESTIONS} initialQuestion={question} startWith={["topYesterday", "buyNow"]} />
    </>
  );
}
