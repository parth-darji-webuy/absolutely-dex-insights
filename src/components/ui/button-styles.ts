import { cn } from "@/lib/cn";

export type ButtonVariant = "default" | "primary" | "ghost";
/** md and sm are the app's buttons, block fills its row, auth is the big sign-in button. */
export type ButtonSize = "md" | "sm" | "block" | "auth";

// Each property is set in exactly one place below, so classes never fight each other.
const BASE =
  "relative inline-flex items-center justify-center overflow-hidden border whitespace-nowrap cursor-pointer transition-[background,border-color,transform] duration-150 active:translate-y-[.5px] disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT: Record<ButtonVariant, string> = {
  default: "border-border bg-card hover:border-border2 hover:bg-hover",
  primary: "border-accent bg-accent text-on-accent hover:border-accent-h hover:bg-accent-h",
  ghost: "border-transparent bg-transparent text-text2 hover:bg-hover hover:text-text",
};

const SIZE: Record<ButtonSize, string> = {
  md: "h-[34px] gap-[7px] rounded-md text-[13px]",
  sm: "h-7 gap-[7px] rounded-[7px] text-xs",
  block: "h-10 w-full gap-[7px] rounded-md text-[13px]",
  auth: "h-[52px] w-full gap-2.5 rounded-[4px] text-[17px]",
};

const PADDING: Record<ButtonSize, string> = { md: "px-[13px]", sm: "px-2.5", block: "px-[13px]", auth: "px-[13px]" };

/** The look of a button, for links that should look like one. */
export const buttonClasses = (variant: ButtonVariant = "default", size: ButtonSize = "md", iconOnly = false, extra?: string) =>
  cn(BASE, VARIANT[variant], SIZE[size], variant === "primary" && size !== "auth" ? "font-semibold" : "font-medium", iconOnly ? "w-[34px] px-0" : PADDING[size], extra);
