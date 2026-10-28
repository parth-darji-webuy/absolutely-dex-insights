import type { ReactNode } from "react";

// Stroke icons on a 24 grid, ported from the prototype's ICONS.
const ICONS = {
  report: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
      <path d="M14 3v5h5"/>
      <path d="M9 13h6M9 17h4"/>
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6L4.6 18.4A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.7-3.1L14 9V3"/>
      <path d="M7.5 15h9"/>
    </>
  ),
  pulse: (
    <>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </>
  ),
  bag: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
      <path d="M3 6h18"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7"/>
      <path d="m21 21-4.3-4.3"/>
    </>
  ),
  chev: (
    <>
      <path d="m6 9 6 6 6-6"/>
    </>
  ),
  chevR: (
    <>
      <path d="m9 18 6-6-6-6"/>
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18M6 6l12 12"/>
    </>
  ),
  spark: (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>
      <path d="M19 15v4M17 17h4"/>
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </>
  ),
  warn: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
      <path d="M12 9v4M12 17h.01"/>
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </>
  ),
  menu: (
    <>
      <path d="M3 6h18M3 12h18M3 18h18"/>
    </>
  ),
  check: (
    <>
      <path d="M20 6 9 17l-5-5"/>
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>
    </>
  ),
  eyeoff: (
    <>
      <path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 8 10 8a13 13 0 0 1-1.7 2.7M6.6 6.6C3.9 8.3 2 12 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </>
  ),
  out: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21a8 8 0 0 1 16 0"/>
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 16v-4M12 8h.01"/>
    </>
  ),
  moonS: (
    <>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>
    </>
  ),
  heartS: (
    <>
      <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </>
  ),
  truck: (
    <>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.6a1 1 0 0 0-.2-.6l-3.5-4.4A1 1 0 0 0 17.5 8H14"/>
      <circle cx="17" cy="18" r="2"/>
      <circle cx="7" cy="18" r="2"/>
    </>
  ),
  shield: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>
      <path d="m9 12 2 2 4-4"/>
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2"/>
      <path d="M5 15V5a2 2 0 0 1 2-2h10"/>
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

type IconProps = {
  name: IconName;
  /** "sm" is the prototype's 14px variant. */
  size?: "md" | "sm";
  className?: string;
};

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const px = size === "sm" ? 14 : 16;
  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`flex-none ${className}`}
    >
      {ICONS[name]}
    </svg>
  );
}
