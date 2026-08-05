import { describe, expect, it } from "vitest";
import { buildSingleDrawCard, calculateSingleSequence, getSingleSequenceIssue } from "./singleDraw";

describe("single-card time sequence", () => {
  it("adds hour and minute when the total is 78 or less", () => {
    expect(calculateSingleSequence(20, 23)).toMatchObject({
      sum: 43,
      sequence: 43,
      formattedSequence: "43",
      usedSubtraction: false,
    });
    expect(calculateSingleSequence(19, 59).sequence).toBe(78);
  });

  it("subtracts hour from minute when the total is greater than 78", () => {
    expect(calculateSingleSequence(23, 59)).toMatchObject({
      sum: 82,
      sequence: 36,
      usedSubtraction: true,
    });
  });

  it("rejects a sequence outside 1 to 78", () => {
    expect(getSingleSequenceIssue(calculateSingleSequence(0, 0))).toContain("1～78");
    expect(getSingleSequenceIssue(calculateSingleSequence(20, 23))).toBeNull();
  });

  it("uses the selected weekday mapping", () => {
    const result = calculateSingleSequence(20, 23);
    const mondayCard = buildSingleDrawCard(result, "monday");
    const tuesdayCard = buildSingleDrawCard(result, "tuesday");

    expect(mondayCard.sequenceValue).toBe(43);
    expect(tuesdayCard.sequenceValue).toBe(43);
    expect(mondayCard.mapping).not.toEqual(tuesdayCard.mapping);
  });
});
