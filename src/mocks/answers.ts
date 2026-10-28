import { fmt, pct } from "@/lib/format";
import type { Answer } from "@/types";
import { CATS, PRODUCTS } from "./products";

// Canned AI answers. Each one carries its numbers and query.
export const ANSWERS = {
  topYesterday: {
    q: "Which product had the most add-to-carts yesterday?",
    a: "The Chronos Obsidian Sapphire Watch had the most add-to-carts yesterday (Oct 15): 68 of 214, about 32% of the day.",
    bars: PRODUCTS.map((p): [string, number] => [p.name, p.yday]),
    cols: ["Product", "Add to carts"],
    rows: PRODUCTS.map((p) => [p.name, fmt(p.yday)]).concat([["Total", "214"]]),
    sql: `SELECT "productName", COUNT(*) AS add_to_carts\nFROM add_to_cart_tracking\nWHERE "createdAt" >= '2026-10-15' AND "createdAt" < '2026-10-16'\nGROUP BY "productName"\nORDER BY add_to_carts DESC;`,
  },
  buyNow: {
    q: "How is the Buy Now test doing?",
    a: "“Buy Now” is ahead: 12.0% of people who saw it added to cart, vs 10.0% for “Add to Cart” (+20%). Insights is about 94% sure; wait ~3 more days. The official result is in GrowthBook.",
    bars: [["Add to Cart (control)", 10.0], ["Buy Now", 12.0]],
    unit: "%",
    cols: ["Variant", "People who saw it", "Added to cart", "Rate"],
    rows: [["Add to Cart", "1,000", "100", "10.0%"], ["Buy Now", "1,000", "120", "12.0%"]],
    sql: `SELECT e."variationId",\n       COUNT(DISTINCT e."anonymousId") AS people,\n       COUNT(DISTINCT a."anonymousId") AS added\nFROM experiment_tracking e\nLEFT JOIN add_to_cart_tracking a\n  ON a."anonymousId" = e."anonymousId"\n AND a."createdAt" >= e."createdAt"\nWHERE e."experimentKey" = 'add-to-cart'\nGROUP BY e."variationId";`,
  },
  dropoff: {
    q: "Where do people drop off in quick view?",
    a: "Most people leave quick view without acting: of 1,872 people who opened it this week, 393 added to cart from it (21%). How many saw the quick view button isn’t tracked yet.",
    bars: [["Opened quick view", 1872], ["Added to cart from quick view", 393]],
    cols: ["Step", "People", "Of previous step"],
    rows: [["Opened quick view", "1,872", "—"], ["Added to cart from quick view", "393", "21.0%"]],
    sql: `SELECT 'Opened quick view' AS step, COUNT(DISTINCT "anonymousId") AS people\nFROM quickview_tracking\nWHERE "createdAt" >= '2026-10-10'\nUNION ALL\nSELECT 'Added to cart from quick view', COUNT(DISTINCT "anonymousId")\nFROM quick_view_cart_events\nWHERE "eventName" = 'add_to_cart' AND "createdAt" >= '2026-10-10';`,
  },
  sizes: {
    q: "Which category sells best?",
    a: "Technology is the top category this week: 514 of 1,416 add-to-carts (36%), from the Nimbus earbuds and the Aperture R4 camera. Watches are next at 29%.",
    bars: CATS.map(([c, n]): [string, number] => [c, n]),
    cols: ["Category", "Add to carts", "Share"],
    rows: CATS.map(([c, n]) => [c, fmt(n), pct((n / 1416) * 100, 0)]),
    sql: `SELECT c.name AS category, COUNT(*) AS add_to_carts\nFROM add_to_cart_tracking a\nJOIN "Product" p ON p.id = a."productId"\nJOIN "Category" c ON c.id = p."categoryId"\nWHERE a."createdAt" >= '2026-10-10'\nGROUP BY c.name\nORDER BY add_to_carts DESC;`,
  },
} satisfies Record<string, Answer>;

export const SUGGESTIONS: string[] = Object.values(ANSWERS).map((a) => a.q);
