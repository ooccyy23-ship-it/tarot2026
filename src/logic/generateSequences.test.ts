import { describe, expect, it } from "vitest";
import { generateSequences, padTwoDigits } from "./generateSequences";

describe("generateSequences", () => {
  it("09:55 should generate 55, 64, 49, 06, 39", () => {
    const result = generateSequences(9, 55);

    expect(result.formattedValues).toEqual({
      s1: "55",
      s2: "64",
      s3: "49",
      s4: "06",
      s5: "39",
    });
  });

  it("leading zeros should be split correctly", () => {
    const result = generateSequences(1, 9);

    expect(result.formattedValues.s1).toBe("09");
    expect(result.formattedValues.s2).toBe("10");
    expect(result.values.s3).toBe(0);
  });

  it("sequence 4 uses addition when s1 + s3 is less than or equal to 78", () => {
    const result = generateSequences(2, 11);

    expect(result.values.s1).toBe(11);
    expect(result.values.s3).toBe(4);
    expect(result.values.s4).toBe(15);
  });

  it("sequence 4 uses absolute difference when s1 + s3 is greater than 78", () => {
    const result = generateSequences(9, 55);

    expect(result.values.s4).toBe(6);
    expect(result.formattedValues.s4).toBe("06");
  });

  it("padTwoDigits keeps two-character formatting", () => {
    expect(padTwoDigits(6)).toBe("06");
    expect(padTwoDigits(50)).toBe("50");
  });
});
