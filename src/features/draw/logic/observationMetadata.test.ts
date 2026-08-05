import { describe, expect, it } from "vitest";
import { createObservationId, formatObservationDate } from "./observationMetadata";

describe("observation metadata", () => {
  const observationDate = new Date(2026, 7, 5, 22, 7);

  it("formats the local observation date with its weekday", () => {
    expect(formatObservationDate(observationDate)).toBe("2026/08/05（星期三）");
  });

  it("creates an observation id from local date and draw time", () => {
    expect(createObservationId(observationDate, "22:07")).toBe("OBS-20260805-2207");
  });

  it("rejects an invalid draw time", () => {
    expect(() => createObservationId(observationDate, "24:00")).toThrow("抽牌時間無效");
    expect(() => createObservationId(observationDate, "9:05")).toThrow("HH:MM");
  });
});
