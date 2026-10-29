import type { DocSection } from "@/lib/docs-content";

/** "On this page": jumps to a section. Sticky on wide screens, a wrapped row on narrow ones. */
export function DocsNav({ sections }: { sections: Pick<DocSection, "id" | "title">[] }) {
  return (
    <nav aria-label="On this page" className="sticky top-6 self-start max-[1080px]:static">
      <p className="mb-2 text-xs font-medium text-text3 max-[1080px]:hidden">On this page</p>
      <ul className="flex flex-col gap-0.5 max-[1080px]:flex-row max-[1080px]:flex-wrap max-[1080px]:gap-2">
        {sections.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="block rounded-md px-2.5 py-1.5 text-[13.5px] text-text2 transition-colors hover:bg-hover hover:text-text max-[1080px]:border max-[1080px]:border-border max-[1080px]:bg-card"
            >
              <span className="mr-1.5 text-text3">{i + 1}</span>
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
