import { describe, expect, it } from "vitest";
import { generateSequences } from "./generateSequences";
import { validateSequences } from "./validateSequences";

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
});
