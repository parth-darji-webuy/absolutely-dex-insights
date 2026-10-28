import type { CategoryCount, ColourCount, Product, QuickViewStats } from "@/types";

// views, quick views and add-to-carts per product for the week. ATC sums to 1,416, QV to 1,872.
export const PRODUCTS: Product[] = [
  { name: "Chronos Obsidian Sapphire Watch", id: "3f9c2a71-5b8e-4d1a-9c47-2e6b8f0d1a35", slug: "chronos-obsidian-sapphire-watch", brand: "Chronos Atelier", cat: "Watches", short: "CW", h: 250, price: 520, views: 3920, qv: 562, atc: 412, yday: 68, opts: ["42mm", "42mm", "38mm"], cols: ["Obsidian Black", "Obsidian Black", "Arctic White"] },
  { name: "Nimbus Pro Wireless Earbuds", id: "8a1d4e92-0c3f-4b7e-a581-6d2f9b3c7e04", slug: "nimbus-pro-wireless-earbuds", brand: "Nimbus Audio", cat: "Technology", short: "NE", h: 205, price: 179, views: 2410, qv: 398, atc: 338, yday: 52, opts: ["One size"], cols: ["Matte Black", "Pearl White"] },
  { name: "Atlas Leather Weekender", id: "c5e7b018-9d2a-4f63-8b1e-0a4c6d8f2b91", slug: "atlas-leather-weekender", brand: "Atlas & Co", cat: "Bags", short: "AW", h: 30, price: 245, views: 1980, qv: 314, atc: 276, yday: 41, opts: ["One size"], cols: ["Cognac", "Black"] },
  { name: "Linea Relaxed Linen Overshirt", id: "1b6f3d85-7e4c-4a29-b0d3-9f5e2c1a8d67", slug: "linea-relaxed-linen-overshirt", brand: "Maison Linea", cat: "Fashion", short: "LO", h: 165, price: 89, views: 3120, qv: 336, atc: 214, yday: 30, opts: ["S", "M", "M", "L", "XL"], cols: ["Sand", "Navy", "White"] },
  { name: "Aperture R4 Mirrorless 8K Camera", id: "e2a94c3b-6f1d-4e85-97b2-4c8a0e6d3f12", slug: "aperture-r4-mirrorless-8k-camera", brand: "Aperture Optics", cat: "Technology", short: "AR", h: 330, price: 3299, views: 2860, qv: 262, atc: 176, yday: 23, opts: ["Body Only", "Body Only", "Body + 24-70mm Kit"], cols: ["Matte Graphite"] },
];

// of 1,416 add-to-carts, by product category
export const CATS: CategoryCount[] = [["Technology", 514], ["Watches", 412], ["Bags", 276], ["Fashion", 214]];
export const COLOURS: ColourCount[] = [["Black", 481, "#16181d"], ["White", 382, "#f4f4f2"], ["Matte Graphite", 227, "#4a4d55"], ["Cognac", 156, "#9a5a2e"]];

export const QV: QuickViewStats = { seen: 6240, btn: 1498, eye: 374, opened: 1872, heartCard: 87, add: 393, detail: 337, wish: 112, closed: 1030, extrasTracked: true };
