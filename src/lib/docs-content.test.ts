import { describe, expect, it } from "vitest";
import { DOC_SECTIONS } from "./docs-content";

const text = JSON.stringify(DOC_SECTIONS);

describe("docs content", () => {
  it("has unique section ids and a title for each", () => {
    const ids = DOC_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(DOC_SECTIONS.every((s) => s.title.length > 0 && s.blocks.length > 0)).toBe(true);
  });

  it("has balanced backticks in every piece of text", () => {
    for (const m of text.matchAll(/"(?:text|title)":"((?:[^"\\]|\\.)*)"/g)) {
      expect((m[1].match(/`/g) ?? []).length % 2).toBe(0);
    }
  });

  it("gives every table row as many cells as the header", () => {
    for (const b of DOC_SECTIONS.flatMap((s) => s.blocks)) {
      if (b.kind === "table") for (const r of b.rows) expect(r).toHaveLength(b.head.length);
    }
  });

  it("holds no secret-looking value", () => {
    expect(text).not.toMatch(/postgres(ql)?:\/\/\S+@/);
    expect(text).not.toMatch(/gsk_[A-Za-z0-9]{10,}|sdk-[A-Za-z0-9]{10,}/);
  });
});
