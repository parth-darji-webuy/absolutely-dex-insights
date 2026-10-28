import Image from "next/image";

export type BrandVariant = "dark" | "light" | "white" | "mark";

// dark  = original colours, for white backgrounds
// light = white "Absolutely" + colour DeX, for the navy sidebar
// white = all white, for the purple sign-in panel
// mark  = "DeX" only, for the narrow icon sidebar (no INSIGHTS line)
const INSIGHTS_COLOUR: Record<Exclude<BrandVariant, "mark">, string> = {
  light: "text-[#C9CDEA]",
  dark: "text-[#24274A]",
  white: "text-white/90",
};

export function BrandMark({ variant = "light", className = "", priority }: { variant?: BrandVariant; className?: string; priority?: boolean }) {
  if (variant === "mark") {
    return (
      <Image
        src="/brand/logo-mark.webp"
        alt="AbsolutelyDeX Insights"
        width={168}
        height={66}
        priority={priority}
        className={`h-auto w-[42px] ${className}`}
      />
    );
  }
  return (
    <div className={`flex w-[176px] flex-col gap-1.5 ${className}`}>
      <Image
        src={`/brand/logo-${variant}.webp`}
        alt="AbsolutelyDeX Insights"
        width={560}
        height={86}
        priority={priority}
        className="block h-auto w-full"
      />
      <div
        aria-hidden="true"
        className={`flex justify-between pr-[3px] pl-1 text-[9.5px] leading-none font-medium ${INSIGHTS_COLOUR[variant]}`}
      >
        {[..."INSIGHTS"].map((c, i) => (
          <i key={i} className="not-italic">
            {c}
          </i>
        ))}
      </div>
    </div>
  );
}
