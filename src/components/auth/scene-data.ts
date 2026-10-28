// The three preview cards on the sign-in page. Fixed numbers: the visitor isn't signed in yet,
// so nothing here comes from the database.
export const SCENE = {
  experiment: {
    name: "Add to Cart button text",
    control: { label: "Add to Cart", rate: 10.0 },
    treatment: { label: "Buy Now", rate: 12.0 },
    foot: "★ Buy Now leading · +20% · 94% sure",
  },
  live: { start: 52, min: 46, max: 58, crowd: ["gY3mR8sDq2Vo", "Lf6tB1zKp9Wu", "Nc0gT5hXk1Js", "Rb7nW3eYs0Qd", "Xm1fJ6gNq9Ea"] },
  trend: { title: "Add to cart · this week", total: 1416, change: "▲ 18% vs last week", days: [178, 186, 195, 204, 212, 214, 227] },
} as const;

export const AUTH_LINES = [
  "See which test is winning, in plain words.",
  "See the last 30 minutes of your store at a glance.",
  "Download experiment reports in one click.",
];
