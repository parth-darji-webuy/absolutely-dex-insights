import type { Metadata } from "next";
import { Blocks } from "@/components/docs/Blocks";
import { DocsNav } from "@/components/docs/DocsNav";
import { PageHeading } from "@/components/shell/PageHeading";
import { Card } from "@/components/ui/Card";
import { DOC_SECTIONS } from "@/lib/docs-content";

export const metadata: Metadata = { title: "Docs" };

// Not in the sidebar or the command palette on purpose: reached by typing /docs.
export default function Page() {
  return (
    <>
      <PageHeading title="Docs" subtitle="How to set this up, where the data comes from, and how it reaches the screen." />
      <div className="grid grid-cols-[200px_minmax(0,1fr)] items-start gap-6 max-[1080px]:grid-cols-1">
        <DocsNav sections={DOC_SECTIONS} />
        <div className="flex min-w-0 flex-col gap-4">
          {DOC_SECTIONS.map((s, i) => (
            <Card key={s.id} id={s.id} title={`${i + 1}. ${s.title}`} subtitle={s.subtitle} delay={Math.min(i, 6) * 40} className="scroll-mt-6">
              <Blocks blocks={s.blocks} />
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
