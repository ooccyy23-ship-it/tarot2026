import { describe, expect, it } from "vitest";
import { convertRocYearToGregorian, formatDateForDisplay, parseObservationDateTime } from "./observationDateTime";

describe("observation date and time parser", () => {
  it("converts ROC years and parses a ROC date", () => {
    expect(convertRocYearToGregorian(115)).toBe(2026);
    expect(parseObservationDateTime("115/8/5 23:02")).toEqual({
      observationDate: "2026-08-05",
      observationTime: "23:02",
      observationDateTime: "2026-08-05T23:02:00",
      originalDateText: "115/8/5 23:02",
    });
  });

  it("parses a Gregorian date and formats it for display", () => {
    expect(parseObservationDateTime("2026/08/05 03:07")?.observationDate).toBe("2026-08-05");
    expect(formatDateForDisplay("2026-08-05")).toBe("2026/08/05");
  });

  it("rejects an invalid calendar date", () => {
    expect(parseObservationDateTime("115/2/30 23:02")).toBeNull();
  });
});
