import { describe, expect, it } from "vitest";
import { buildOpenObservationGroup, createOpenObservationCode, validateOpenObservation, type OpenObservationInput } from "./openObservation";

function validInput(): OpenObservationInput {
  return {
    source: "draw_result",
    observationDate: "2026-08-16",
    drawTime: "22:18",
    weekdayLabel: "星期日",
    drawMethod: "時間五序號抽牌",
    note: "只作補充，不是題目。",
    cards: ["愚者", "聖杯3", "寶劍5", "權杖9", "星幣7"].map((cardName, index) => ({
      position: index + 1,
      serialNumber: index + 1,
      cardName,
      orientation: index % 2 === 0 ? "upright" as const : "reversed" as const,
    })),
  };
}

describe("open observation", () => {
  it("creates a stable display code and five question-free records", () => {
    expect(createOpenObservationCode("2026-08-16", "22:18")).toBe("OBS-20260816-2218");
    const group = buildOpenObservationGroup(validInput(), new Date("2026-08-16T14:18:00.000Z"));
    expect(group.recordType).toBe("open_observation");
    expect(group.observationCode).toBe("OBS-20260816-2218");
    expect(group.records).toHaveLength(5);
    expect(group.records.every((record) => record.questionText === "")).toBe(true);
    expect(group.records.map((record) => record.position)).toEqual([1, 2, 3, 4, 5]);
  });

  it("rejects incomplete cards, unknown cards and missing orientations", () => {
    const incomplete = validInput();
    incomplete.cards[1] = { ...incomplete.cards[1], cardName: "不存在的牌", orientation: "" };
    const errors = validateOpenObservation(incomplete);
    expect(errors).toContain("位置 2 尚未選擇有效牌卡。");
    expect(errors).toContain("位置 2 尚未選擇正逆位。");
  });
});
