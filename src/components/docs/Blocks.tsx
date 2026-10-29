import { Icon } from "@/components/Icon";
import type { DocBlock } from "@/lib/docs-content";
import { CodeBlock } from "./CodeBlock";
import { Inline } from "./Inline";

function Steps({ items }: { items: Extract<DocBlock, { kind: "steps" }>["items"] }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((s, i) => (
        <li key={s.title} className="flex min-w-0 gap-3">
          <span className="mt-px grid size-6 flex-none place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-text">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              <Inline text={s.title} />
            </p>
            {s.text && (
              <p className="mt-0.5 text-[13.5px] leading-[1.55] text-text2">
                <Inline text={s.text} />
              </p>
            )}
            {s.code && <CodeBlock code={s.code} />}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="bg-card2 text-xs text-text3">
            {head.map((h) => (
              <th key={h} className="px-3.5 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-border align-top">
              {r.map((c, i) => (
                <td key={i} className={i === 0 ? "px-3.5 py-2.5 font-medium whitespace-nowrap max-[560px]:whitespace-normal" : "px-3.5 py-2.5 text-text2"}>
                  <Inline text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Flow({ items }: { items: Extract<DocBlock, { kind: "flow" }>["items"] }) {
  return (
    <div className="flex items-stretch gap-2 max-[820px]:flex-col" role="list" aria-label="Data path">
      {items.map((it, i) => (
        <div key={it.title} className="flex min-w-0 flex-1 items-center gap-2 max-[820px]:flex-col" role="listitem">
          <div className="w-full flex-1 rounded-lg border border-border bg-card2 px-3 py-2.5 text-center">
            <p className="font-mono text-[12.5px] font-medium">{it.title}</p>
            <p className="mt-0.5 text-xs text-text3">{it.text}</p>
          </div>
          {i < items.length - 1 && (
            <span className="flex-none text-text3 max-[820px]:rotate-90" aria-hidden>
              <Icon name="arrow" size="sm" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** The page-load path as a stack of layers, top to bottom, with the outside services at the end. */
function Layers({ items, outside }: Omit<Extract<DocBlock, { kind: "layers" }>, "kind">) {
  const down = (
    <span className="flex justify-center py-1 text-text3 rotate-90" aria-hidden>
      <Icon name="arrow" size="sm" />
    </span>
  );
  return (
    <div role="list" aria-label="Structure, top to bottom">
      {items.map((it) => (
        <div key={it.title} role="listitem">
          <div className="rounded-lg border border-border bg-card2 px-3.5 py-2.5">
            <p className="font-mono text-[12.5px] font-medium">{it.title}</p>
            <p className="mt-0.5 text-[13px] leading-[1.5] text-text2">{it.text}</p>
          </div>
          {down}
        </div>
      ))}
      <div className="grid grid-cols-3 gap-2 max-[560px]:grid-cols-1" role="listitem">
        {outside.map((o) => (
          <div key={o.title} className="rounded-lg border border-dashed border-border2 bg-card px-3 py-2.5 text-center">
            <p className="text-[13px] font-medium">{o.title}</p>
            <p className="mt-0.5 text-xs text-text3">{o.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Blocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "p":
            return (
              <p key={i} className="text-[14px] leading-[1.6] text-text2">
                <Inline text={b.text} />
              </p>
            );
          case "note":
            return (
              <p key={i} className="rounded-lg bg-accent-soft px-3.5 py-2.5 text-[13.5px] leading-[1.55] text-text2">
                <Inline text={b.text} />
              </p>
            );
          case "steps":
            return <Steps key={i} items={b.items} />;
          case "table":
            return <Table key={i} head={b.head} rows={b.rows} />;
          case "flow":
            return <Flow key={i} items={b.items} />;
          case "layers":
            return <Layers key={i} items={b.items} outside={b.outside} />;
        }
      })}
    </div>
  );
}
