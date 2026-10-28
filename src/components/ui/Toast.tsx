"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";

type ToastItem = { id: number; message: string; icon: IconName; leaving: boolean };
type ToastApi = { toast: (message: string, icon?: IconName) => void };

const ToastContext = createContext<ToastApi | null>(null);
let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, icon: IconName = "check") => {
    const id = ++nextId;
    setItems((l) => [...l, { id, message, icon, leaving: false }]);
    setTimeout(() => setItems((l) => l.map((t) => (t.id === id ? { ...t, leaving: true } : t))), 2600);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 2900);
  }, []);
  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[220] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={`flex animate-[toast_.25s_var(--ease)] items-center gap-[9px] rounded-[10px] bg-text px-3.5 py-2.5 text-[13px] font-medium text-bg shadow-pop transition-opacity duration-300 ${t.leaving ? "opacity-0" : ""}`}
          >
            <Icon name={t.icon} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? { toast: () => {} };
}
