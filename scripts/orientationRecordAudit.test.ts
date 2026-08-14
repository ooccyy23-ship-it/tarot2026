import { describe, expect, it } from "vitest";
import { auditOrientationRecords } from "./orientationRecordAudit";

describe("read-only orientation record audit", () => {
  it("separates formal, null, missing, legacy, and unknown formats", () => {
    const result = auditOrientationRecords([
      { orientation: "upright", observationDate: "2026-08-01" },
      { orientation: "reversed", observationDate: "2026-08-01" },
      { orientation: null, observationDate: "2026-08-02" },
      { observationDate: "2026-08-02" },
      { orientation: "正位", observationDate: "2026-08-02" },
      { orientation: true, observationDate: "2026-08-03" },
      { orientation: "UPRIGHT", observationDate: "2026-08-03" },
    ]);

    expect(result).toMatchObject({
      total: 7,
      formalCount: 2,
      uprightCount: 1,
      reversedCount: 1,
      invalidOrientationCount: 5,
      nullCount: 1,
      unknownFormatCount: 4,
    });
    expect(result.formats).toMatchObject({
      upright: 1,
      reversed: 1,
      chinese_upright: 1,
      boolean_true: 1,
      null: 1,
      missing: 1,
      unknown: 1,
    });
    expect(result.daily[0]).toMatchObject({
      period: "2026-08-01",
      total: 2,
      upright: 1,
      reversed: 1,
      invalid: 0,
      uprightPercentage: 50,
      reversedPercentage: 50,
    });
  });
});
