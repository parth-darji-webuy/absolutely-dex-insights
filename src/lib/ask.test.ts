import { describe, expect, it } from "vitest";
import { ANSWERS } from "@/mocks";
import { matchAnswer } from "./ask";

describe("matchAnswer", () => {
  it.each([
    ["How is the Buy Now test doing?", ANSWERS.buyNow],
    ["Where do people drop off in quick view?", ANSWERS.dropoff],
    ["Which category sells best?", ANSWERS.sizes],
    ["Which product had the most add-to-carts yesterday?", ANSWERS.topYesterday],
    ["WHICH PRODUCT IS BEST", ANSWERS.topYesterday],
  ])("%s", (q, expected) => expect(matchAnswer(q, ANSWERS)).toBe(expected));

  it("returns null for anything else, including nothing", () => {
    expect(matchAnswer("What is the weather like?", ANSWERS)).toBeNull();
    expect(matchAnswer("", ANSWERS)).toBeNull();
  });
});
