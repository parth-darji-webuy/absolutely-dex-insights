import type { Metadata } from "next";
import { ComingSoon } from "@/components/shell/ComingSoon";
import { PageHeading } from "@/components/shell/PageHeading";

export const metadata: Metadata = { title: "Events" };

export default function Page() {
  return (
    <>
      <PageHeading page="events" />
      <ComingSoon />
    </>
  );
}
