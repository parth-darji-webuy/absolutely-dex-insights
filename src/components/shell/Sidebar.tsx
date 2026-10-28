"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { BrandMark } from "@/components/BrandMark";
import { Icon } from "@/components/Icon";
import { PAGES } from "./nav";

function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav className="nav">
      {PAGES.map((p) => {
        const here = pathname !== null && (pathname === `/${p.id}` || pathname.startsWith(`/${p.id}/`));
        return (
          <Link key={p.id} href={`/${p.id}`} title={p.label} aria-current={here ? "page" : undefined}>
            <Icon name={p.icon} />
            <span className="nav-label">{p.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// Reading the address needs its own Suspense boundary; until it's known no link is marked.
function ActiveNav() {
  return <NavList pathname={usePathname()} />;
}

/** Navy sidebar. A full menu on desktop, an icon rail on tablets, a slide-in menu on phones. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="side" aria-label="Main" onClick={(e) => (e.target as HTMLElement).closest("a") && onNavigate?.()}>
      <div className="brand">
        <div className="brand-full">
          <BrandMark variant="light" priority />
        </div>
        <BrandMark variant="mark" className="brand-mark" priority />
      </div>
      <div className="nav-h">Analytics</div>
      <Suspense fallback={<NavList pathname={null} />}>
        <ActiveNav />
      </Suspense>
    </aside>
  );
}
