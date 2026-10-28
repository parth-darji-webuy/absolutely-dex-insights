// What the AI is told about the database, and the only tables a question may read.
// Keep the columns in step with prisma/schema.prisma (a test checks they exist there).

export type AskTable = { name: string; /** How the table is written in SQL. */ sql: string; columns: [column: string, note: string][] };

export const ASK_TABLES: AskTable[] = [
  {
    name: "experiment_tracking",
    sql: "experiment_tracking",
    columns: [
      ["id", "text"],
      ["anonymousId", "text, the visitor"],
      ["experimentKey", "text"],
      ["experimentName", "text"],
      ["variationId", "int, 0 = control, 1 = treatment"],
      ["variationName", "text"],
      ["variationValue", "text"],
      ["featureId", "text, the feature flag"],
      ["createdAt", "timestamp, UTC"],
    ],
  },
  {
    name: "add_to_cart_tracking",
    sql: "add_to_cart_tracking",
    columns: [
      ["id", "text"],
      ["anonymousId", "text, the visitor"],
      ["productId", "text, joins to \"Product\".id"],
      ["productName", "text"],
      ["slug", "text"],
      ["brand", "text"],
      ["price", "numeric, in pounds"],
      ["quantity", "int"],
      ["selectedSize", "text"],
      ["selectedColor", "text"],
      ["createdAt", "timestamp, UTC"],
    ],
  },
  {
    name: "quickview_tracking",
    sql: "quickview_tracking",
    columns: [
      ["id", "text"],
      ["anonymousId", "text, the visitor"],
      ["customerId", "text"],
      ["productId", "text, joins to \"Product\".id"],
      ["featureKey", "text"],
      ["featureEnabled", "boolean"],
      ["experimentKey", "text"],
      ["variationId", "int"],
      ["createdAt", "timestamp, UTC"],
    ],
  },
  {
    name: "quick_view_cart_events",
    sql: "quick_view_cart_events",
    columns: [
      ["id", "text"],
      ["anonymousId", "text, the visitor"],
      ["productId", "text, joins to \"Product\".id"],
      ["eventName", "text, e.g. add_to_cart"],
      ["source", "text"],
      ["createdAt", "timestamp, UTC"],
    ],
  },
  {
    name: "whats_new_tracking",
    sql: "whats_new_tracking",
    columns: [
      ["id", "text"],
      ["anonymousId", "text, the visitor"],
      ["experimentKey", "text"],
      ["variationId", "int"],
      ["variationName", "text"],
      ["variationValue", "text"],
      ["createdAt", "timestamp, UTC"],
    ],
  },
  {
    name: "theme_toggle_tracking",
    sql: "theme_toggle_tracking",
    columns: [
      ["id", "text"],
      ["anonymousId", "text, the visitor"],
      ["theme", "text, dark or light"],
      ["createdAt", "timestamp, UTC"],
    ],
  },
  {
    name: "Product",
    sql: '"Product"',
    columns: [
      ["id", "text"],
      ["name", "text"],
      ["slug", "text"],
      ["brand", "text"],
      ["price", "number, in pounds"],
      ["originalPrice", "number"],
      ["discount", "int"],
      ["categoryId", "text, joins to \"Category\".id"],
      ["rating", "number"],
      ["reviewCount", "int"],
      ["stockStatus", "text"],
      ["isFeatured", "boolean"],
      ["isNewArrival", "boolean"],
      ["isTrending", "boolean"],
      ["createdAt", "timestamp, UTC"],
    ],
  },
  {
    name: "Category",
    sql: '"Category"',
    columns: [
      ["id", "text"],
      ["name", "text"],
      ["slug", "text"],
    ],
  },
];

/** Exactly as Postgres names them: the tracking tables in lower case, Product and Category capitalised. */
export const ALLOWED_TABLE_NAMES: ReadonlySet<string> = new Set(ASK_TABLES.map((t) => t.name));

/** The schema as text for the AI's instructions. */
export const schemaText = (): string =>
  ASK_TABLES.map((t) => `${t.sql} (${t.columns.map(([c, note]) => `"${c}" ${note}`).join("; ")})`).join("\n");
