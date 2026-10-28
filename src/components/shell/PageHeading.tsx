import type { ReactNode } from "react";
import { SUBS, TITLES } from "./nav";

/** The big title and one plain-words line under it. Pass `page` to use the standard wording. */
export function PageHeading({ page, title, subtitle, actions }: { page?: string; title?: string; subtitle?: string; actions?: ReactNode }) {
  const heading = title ?? (page ? TITLES[page] : "") ?? "";
  const sub = subtitle ?? (page ? SUBS[page] : undefined);
  return (
    <div className="page-h fade flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1>{heading}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions}
    </div>
  );
}
