"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type PaletteApi = { open: boolean; show: () => void; hide: () => void; /** False when AI_PROVIDER is "none": no Ask in ⌘K or the header. */ aiEnabled: boolean };
const PaletteContext = createContext<PaletteApi | null>(null);

/** Holds whether the ⌘K palette is open, and listens for ⌘K / Ctrl+K anywhere in the app. */
export function PaletteProvider({ children, aiEnabled = true }: { children: ReactNode; aiEnabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const api = useMemo(() => ({ open, show, hide, aiEnabled }), [open, show, hide, aiEnabled]);
  return <PaletteContext value={api}>{children}</PaletteContext>;
}

export function usePalette(): PaletteApi {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used inside <PaletteProvider>");
  return ctx;
}
