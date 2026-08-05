import { describe, expect, it } from "vitest";
import { generateSequences } from "./generateSequences";
import { validateSequences } from "./validateSequences";
import type { SequenceResult } from "../types/tarot";

describe("validateSequences", () => {
  it("01:09 should have sequence 3 equal to 0 and be invalid", () => {
    const result = generateSequences(1, 9);
    const issues = validateSequences(result);

    expect(result.values.s3).toBe(0);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sequence: "s3",
          value: 0,
          reason: "序號不可為0",
        }),
      ]),
    );
  });

  it("23:59 should have sequence 2 equal to 82 and be invalid", () => {
    const result = generateSequences(23, 59);
    const issues = validateSequences(result);

    expect(result.values.s2).toBe(82);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sequence: "s2",
          value: 82,
          reason: "序號不可大於78",
        }),
      ]),
    );
  });

  it("rejects all repeated values in a five-sequence result", () => {
    const result: SequenceResult = {
      hour: 20,
      minute: 20,
      values: { s1: 20, s2: 20, s3: 12, s4: 23, s5: 55 },
      formattedValues: { s1: "20", s2: "20", s3: "12", s4: "23", s5: "55" },
      explanations: { s1: "", s2: "", s3: [], s4: [], s5: "" },
    };

    const issues = validateSequences(result);

    expect(issues).toHaveLength(2);
    expect(issues.map((issue) => issue.sequence)).toEqual(["s1", "s2"]);
    expect(issues.every((issue) => issue.reason === "序號重複：數值 20 共出現 2 次")).toBe(true);
  });

  it("accepts five unique values within 1 to 78", () => {
    expect(validateSequences(generateSequences(9, 55))).toEqual([]);
  });
});
