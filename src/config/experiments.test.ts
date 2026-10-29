import { describe, expect, it } from "vitest";
import { isHiddenExperiment } from "./experiments";

describe("isHiddenExperiment", () => {
  it("hides the GA4 copies and does not touch other tests", () => {
    expect(isHiddenExperiment("add-to-cart-ga4")).toBe(true);
    expect(isHiddenExperiment("quick-view-enabled-ga4")).toBe(true);
    expect(isHiddenExperiment("Add-Cart-Button-Experience-GA4")).toBe(true);
    expect(isHiddenExperiment("add-to-cart")).toBe(false);
    expect(isHiddenExperiment("ga4-banner")).toBe(false);
    expect(isHiddenExperiment("quick-view-ab-test")).toBe(false);
  });

  it("hides a test that is named one by one", () => {
    expect(isHiddenExperiment("quick-view-style")).toBe(true);
    expect(isHiddenExperiment("Quick-View-Style")).toBe(true);
  });
});
