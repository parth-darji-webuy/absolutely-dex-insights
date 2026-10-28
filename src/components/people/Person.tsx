import { cn } from "@/lib/cn";
import type { Look } from "./look";

export type PersonProp = "" | "bag" | "glass" | "phone";
export type PersonMotion = "none" | "idle" | "walking";

const PROPS: Record<Exclude<PersonProp, "">, React.ReactNode> = {
  bag: (
    <>
      <rect x="27.5" y="49" width="8" height="9" rx="1.6" fill="#6E56CF" />
      <path d="M29.5 49v-1.6a2 2 0 0 1 4 0V49" fill="none" stroke="#6E56CF" strokeWidth="1.2" />
    </>
  ),
  glass: (
    <>
      <circle cx="34" cy="47" r="4.2" fill="#fff" fillOpacity=".6" stroke="#2D3142" strokeWidth="1.6" />
      <path d="M31.5 50.5 29 54" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  phone: (
    <>
      <rect x="28" y="44" width="6" height="10" rx="1.4" fill="#2D3142" />
      <rect x="29" y="45.5" width="4" height="6.5" rx=".6" fill="#9DB4FF" />
    </>
  ),
};

function Hair({ style, hair }: Pick<Look, "style" | "hair">) {
  const cap = <path d="M12 15a8 8 0 0 1 16 0c-1.6-3-4.6-4.6-8-4.6S13.6 12 12 15z" fill={hair} />;
  if (style === "long")
    return (
      <>
        {cap}
        <rect x="10.6" y="12" width="4" height="15" rx="2" fill={hair} />
        <rect x="25.4" y="12" width="4" height="15" rx="2" fill={hair} />
      </>
    );
  if (style === "bun")
    return (
      <>
        <circle cx="20" cy="5.5" r="4" fill={hair} />
        {cap}
      </>
    );
  if (style === "cap")
    return (
      <>
        <path d="M11.8 13.5a8.2 8.2 0 0 1 16.4 0z" fill={hair} />
        <rect x="22" y="11.6" width="10" height="2.6" rx="1.3" fill={hair} />
      </>
    );
  return cap;
}

/** A small flat character, `h` px tall. Motion is a CSS animation, switched off for reduced motion. */
export function Person({ look, h = 60, prop = "", motion = "none", className }: { look: Look; h?: number; prop?: PersonProp; motion?: PersonMotion; className?: string }) {
  const { skin, shirt, pants, hair, style } = look;
  return (
    <svg className={cn("person", motion !== "none" && motion, className)} viewBox="0 0 40 80" width={h / 2} height={h} aria-hidden="true">
      <g className="bd">
        <g className="lg l">
          <rect x="13.5" y="50" width="6" height="24" rx="3" fill={pants} />
          <ellipse cx="16" cy="75.5" rx="4.6" ry="2.6" fill="#262833" />
        </g>
        <g className="lg r">
          <rect x="20.5" y="50" width="6" height="24" rx="3" fill={pants} />
          <ellipse cx="24" cy="75.5" rx="4.6" ry="2.6" fill="#262833" />
        </g>
        <g className="am l">
          <rect x="7" y="29" width="5" height="20" rx="2.5" fill={shirt} />
          <circle cx="9.5" cy="49.5" r="2.6" fill={skin} />
        </g>
        <g className="am r">
          <rect x="28" y="29" width="5" height="20" rx="2.5" fill={shirt} />
          <circle cx="30.5" cy="49.5" r="2.6" fill={skin} />
          {prop && PROPS[prop]}
        </g>
        <rect x="11" y="27" width="18" height="26" rx="7" fill={shirt} />
        <rect x="17.5" y="21.5" width="5" height="6.5" rx="1" fill={skin} />
        <circle cx="20" cy="15" r="8" fill={skin} />
        <Hair style={style} hair={hair} />
        <circle cx="17.3" cy="16" r=".95" fill="#262833" />
        <circle cx="22.7" cy="16" r=".95" fill="#262833" />
        <path d="M17.6 19.2q2.4 1.8 4.8 0" fill="none" stroke="#262833" strokeWidth=".9" strokeLinecap="round" />
      </g>
    </svg>
  );
}
