import { describe, expect, it } from "vitest";
import { tarotDesignGuides, tarotDesignTokens } from "./tarotDesignGuides";

describe("tarot design guides", () => {
  it("contains four cups court guides with unique ids", () => {
    expect(tarotDesignGuides).toHaveLength(4);
    expect(new Set(tarotDesignGuides.map((guide) => guide.id)).size).toBe(4);
  });

  it("shares reusable palette tokens", () => {
    expect(tarotDesignTokens.palette).toHaveLength(7);
    expect(tarotDesignGuides.every((guide) => guide.palette.length === tarotDesignTokens.palette.length)).toBe(true);
  });
});
