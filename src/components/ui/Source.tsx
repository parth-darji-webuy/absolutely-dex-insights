import { Tag } from "./Tag";

/** The "Source" line under a card: which tables feed it, or what isn't tracked yet. */
export function Source({ tables, gap }: { tables: React.ReactNode[]; gap?: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-dashed border-border pt-3 text-[11.5px] text-text3">
      <span>Source</span>
      {tables.map((t, i) =>
        typeof t === "string" ? (
          <code key={i} className="rounded-[5px] border border-border bg-card2 px-1.5 py-px text-[11px] text-text2">
            {t}
          </code>
        ) : (
          <span key={i}>{t}</span>
        ),
      )}
      {gap && (
        <Tag tone="warn" className="h-5 text-[11px]">
          {gap}
        </Tag>
      )}
    </div>
  );
}
