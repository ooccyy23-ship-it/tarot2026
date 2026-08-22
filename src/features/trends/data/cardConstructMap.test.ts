import { describe, expect, it } from "vitest";
import { CARD_CONSTRUCT_MAPPINGS, validateCardConstructMappings } from "./cardConstructMap";

describe("cardConstructMap", () => {
  it("covers every canonical card without inventing missing N Model mappings", () => {
    const result = validateCardConstructMappings();
    expect(result.valid).toBe(true);
    expect(CARD_CONSTRUCT_MAPPINGS).toHaveLength(78);
    expect(result.mapped).toBe(1);
    expect(result.unassigned).toBe(77);
    expect(CARD_CONSTRUCT_MAPPINGS.find((item) => item.cardName === "聖杯皇后")?.category).toBe("EMOTIONAL_CONNECTION");
  });
});
