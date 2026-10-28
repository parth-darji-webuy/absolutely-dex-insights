"use client";

import type { ButtonHTMLAttributes, PointerEvent } from "react";
import { type ButtonSize, type ButtonVariant, buttonClasses } from "./button-styles";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square button that holds only an icon. */
  iconOnly?: boolean;
};

/** A soft circle grows from the press point, unless the visitor asked for less motion. */
function ripple(e: PointerEvent<HTMLButtonElement>) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const b = e.currentTarget;
  if (b.disabled) return;
  const r = b.getBoundingClientRect();
  const d = Math.max(r.width, r.height) * 2;
  const dot = document.createElement("span");
  dot.className = "ripple";
  dot.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(dot);
  setTimeout(() => dot.remove(), 650);
}

export function Button({ variant = "default", size = "md", iconOnly, className, type = "button", onPointerDown, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, iconOnly, className)}
      onPointerDown={(e) => {
        ripple(e);
        onPointerDown?.(e);
      }}
      {...props}
    />
  );
}
