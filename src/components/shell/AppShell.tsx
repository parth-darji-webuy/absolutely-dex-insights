"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/Button";
import { AskAiButton } from "./AskAiButton";
import { AskBar } from "./AskBar";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  /** The signed-in user and Sign out, rendered on the server. */
  account: ReactNode;
  children: ReactNode;
};

export function AppShell({ account, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className={menuOpen ? "app mnav" : "app"}>
      <div className="nav-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <Sidebar onNavigate={() => setMenuOpen(false)} />
      <div className="main">
        <header className="top">
          <Button variant="ghost" iconOnly className="hamburger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            <Icon name="menu" />
          </Button>
          <AskBar />
          <AskAiButton />
          {account}
        </header>
        <main className="page" id="page">
          {children}
        </main>
      </div>
    </div>
  );
}
