import type { Metadata } from "next";
import { ComingSoon } from "@/components/shell/ComingSoon";
import { PageHeading } from "@/components/shell/PageHeading";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return (
    <>
      <PageHeading page="overview" />
      <ComingSoon />
    </>
  );
}
