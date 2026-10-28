import { rng, seedOf } from "@/lib/rng";

export type Look = { skin: string; shirt: string; pants: string; hair: string; style: "short" | "long" | "bun" | "cap" };

const SKIN = ["#F2C9A5", "#E0AC83", "#C68B62", "#9A6644", "#6E4630", "#F7DCC6"];
const SHIRT = ["#6E56CF", "#4F72D0", "#22998B", "#C2569C", "#F29A2E", "#2D3142", "#E0334D"];
const PANTS = ["#2D3142", "#3E4C6E", "#4A5068", "#5B4B8A", "#6B7280"];
const HAIR = ["#2B2118", "#5A3A22", "#B07A3E", "#1C1C1C", "#8C8C8C", "#7A2E1F"];
const STYLES: Look["style"][] = ["short", "long", "bun", "cap", "short", "long"];

/** Seeded, so the same visitor always looks the same. */
export function look(seed: number): Look {
  const r = rng(seed * 7919 + 13);
  const p = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  return { skin: p(SKIN), shirt: p(SHIRT), pants: p(PANTS), hair: p(HAIR), style: p(STYLES) };
}

/** Look for any string, e.g. an anonymous visitor id. */
export const lookOf = (id: string): Look => look(seedOf(id));

/** The character used in empty and error states. */
export const EMPTY_LOOK: Look = { skin: "#E0AC83", shirt: "#6E56CF", pants: "#2D3142", hair: "#2B2118", style: "short" };
