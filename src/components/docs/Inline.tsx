import { Fragment } from "react";

/** Text where `like this` is shown as code. */
export function Inline({ text }: { text: string }) {
  return text.split("`").map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} className="rounded-[5px] bg-card2 px-1.5 py-px font-mono text-[12.5px] text-text">
        {part}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
