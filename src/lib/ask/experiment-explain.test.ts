import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const chat = vi.hoisted(() => ({ reply: "", fail: false, calls: 0 }));
vi.mock("./groq", () => ({
  groqChat: async () => {
    chat.calls++;
    if (chat.fail) throw new Error("busy");
    return chat.reply;
  },
}));

const { aiExplainExperiment, cleanExplanation, explainFacts, ungroundedNumbers } = await import("./experiment-explain");
const { EXPS } = await import("@/test/fixtures");

const e = EXPS[0];
const facts = explainFacts(e);

describe("explainFacts", () => {
  it("carries the figures the page shows", () => {
    expect(facts.chancePercent).toBe(e.chance);
    expect(facts.control.people).toBe(e.c.people);
    expect(facts.treatment.converted).toBe(e.t.conv);
  });
});

describe("ungroundedNumbers", () => {
  it("accepts only given numbers, and lists the strays", () => {
    expect(ungroundedNumbers(`${facts.chancePercent}% chance, with ${facts.control.people} people in control.`, facts)).toEqual([]);
    expect(ungroundedNumbers("A lift of 123456%.", facts)).toEqual(["123456"]);
  });

  it("accepts a number that is part of the test's own wording", () => {
    const named = { ...facts, name: "Free shipping over 50 pounds", treatment: { ...facts.treatment, label: "Variant 3" } };
    expect(ungroundedNumbers("Variant 3 and 987654 people over 50 pounds.", named)).toEqual(["987654"]);
  });
});

describe("cleanExplanation", () => {
  it("splits paragraphs and strips markdown", () => {
    expect(cleanExplanation("**One.**\n\nTwo.\nStill two.")).toEqual(["One.", "Two. Still two."]);
  });
  it("refuses empty or overlong replies", () => {
    expect(cleanExplanation("  ")).toBeNull();
    expect(cleanExplanation("x".repeat(801))).toBeNull();
    expect(cleanExplanation("a\n\nb\n\nc\n\nd\n\ne\n\nf")).toBeNull();
  });
});

describe("aiExplainExperiment", () => {
  it("returns the paragraphs, then reuses them", async () => {
    chat.reply = `About ${e.chance} in 100.\n\nMore people are needed.`;
    expect(await aiExplainExperiment(e)).toHaveLength(2);
    const calls = chat.calls;
    await aiExplainExperiment(e);
    expect(chat.calls).toBe(calls);
  });
  it("falls back (null) on a made-up number or a failure", async () => {
    const other = { ...EXPS[1], key: "other-1", name: "Other one" };
    chat.reply = "It improved 987654%.";
    expect(await aiExplainExperiment(other)).toBeNull();
    const another = { ...EXPS[1], key: "other-2", name: "Another one" };
    chat.fail = true;
    expect(await aiExplainExperiment(another)).toBeNull();
    chat.fail = false;
  });
});
