"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import { useDialog } from "@/hooks/useDialog";
import { cn } from "@/lib/cn";
import { type PaletteExperiment, paletteItems } from "./palette-items";
import { usePalette } from "./PaletteProvider";

type Props = { experiments: PaletteExperiment[]; suggestions: string[] };

/** ⌘K: ask a question, jump to a page, jump to an experiment. Arrows, Enter and Escape. */
export function CommandPalette({ experiments, suggestions }: Props) {
  const { open, hide } = usePalette();
  if (!open || typeof document === "undefined") return null;
  return createPortal(<Palette experiments={experiments} suggestions={suggestions} onClose={hide} />, document.body);
}

function Palette({ experiments, suggestions, onClose }: Props & { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useDialog(box, true, onClose);

  const items = useMemo(() => paletteItems(query, experiments, suggestions), [query, experiments, suggestions]);
  const current = Math.min(sel, Math.max(0, items.length - 1));

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [current, items]);

  const run = (i: number) => {
    const item = items[i];
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel(Math.min(current + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel(Math.max(0, current - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(current);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center bg-scrim pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal="true" aria-label="Command palette" className="pop-in w-[min(640px,calc(100vw-32px))] overflow-hidden rounded-[14px] border border-border2 bg-card shadow-pop">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5 text-text3">
          <Icon name="search" />
          <input
            data-autofocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Ask about your data, e.g. Which product had the most add-to-carts yesterday?"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items.length ? `pal-${current}` : undefined}
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-text outline-0"
          />
          <kbd>esc</kbd>
        </div>
        <div ref={list} id="palette-list" role="listbox" className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5">
          {items.length === 0 && (
            <div className="flex min-h-[100px] flex-col items-center justify-center gap-1.5 px-4 py-[34px] text-center">
              <b className="text-sm font-semibold">No matches</b>
              <p className="text-[13px] text-text2">Press Enter to ask AI instead.</p>
            </div>
          )}
          {items.map((it, i) => {
            const heading = it.group !== items[i - 1]?.group ? it.group : null;
            return (
              <div key={`${it.group}-${it.label}`}>
                {heading && <div className="px-2.5 pt-2.5 pb-1 text-[11px] font-semibold tracking-[.06em] text-text3 uppercase">{heading}</div>}
                <div
                  id={`pal-${i}`}
                  role="option"
                  aria-selected={i === current}
                  onClick={() => run(i)}
                  className={cn("group flex h-[38px] cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-text", i === current && "bg-hover")}
                >
                  <Icon name={it.icon} className={i === current ? "text-text" : "text-text3"} />
                  <span className="min-w-0 truncate">{it.label}</span>
                  {it.hint && <span className="ml-auto text-xs text-text3">{it.hint}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3.5 border-t border-border px-3.5 py-[9px] text-[11.5px] text-text3">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>Type a question to ask AI</span>
        </div>
      </div>
    </div>
  );
}
