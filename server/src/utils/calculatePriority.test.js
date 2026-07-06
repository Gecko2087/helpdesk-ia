import { describe, expect, it } from "vitest";

import { calculatePriority } from "./calculatePriority.js";

describe("calculatePriority", () => {
  it.each([
    ["high", "high", "critical"],
    ["high", "medium", "high"],
    ["medium", "high", "high"],
    ["medium", "medium", "medium"],
    ["low", "high", "medium"],
    ["low", "medium", "low"],
    ["low", "low", "low"]
  ])("returns %s/%s as %s", (impact, urgency, expected) => {
    expect(calculatePriority(impact, urgency)).toBe(expected);
  });

  it("defaults unknown combinations to low", () => {
    expect(calculatePriority("unknown", "unknown")).toBe("low");
  });
});
