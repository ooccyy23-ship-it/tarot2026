import { describe, expect, it } from "vitest";
import type { Observation } from "../types/observation";
import { filterObservations } from "./filterObservations";
import { getEffectiveVerificationStatus } from "../../verification/logic/verificationStatus";

function createObservation(id: string, date: string, dueDate: string, status: Observation["verification"]["status"] = "pending"): Observation {
  return {
    id, schemaVersion: 1, observationDate: date, drawTime: "09:00",
    createdAt: `${date}T01:00:00.000Z`, updatedAt: `${date}T01:00:00.000Z`,
    subjectAlias: id === "old" ? "甲方" : "乙方", topic: "關係觀測", weekday: 2, weekdayLabel: "星期二",
    questionGroupId: "g1",
    questionGroupSnapshot: {
      id: "g1", category: "測試", title: "測試題組", source: "custom", active: true,
      createdAt: "", updatedAt: "", questions: Array.from({ length: 5 }, (_, index) => ({ id: `q${index}`, order: index + 1, title: `問題 ${index + 1}` })),
    },
    preEmotion: { primaryEmotion: "平靜", expectationLevel: 5, anxietyLevel: 5, calmLevel: 5 },
    drawResult: { drawTime: "09:00", selectedWeekday: 2, sequences: [], cards: [], completedAt: "" },
    interpretations: [], overallInterpretation: {},
    verification: { requirement: "required", status, dueDate },
  };
}

describe("observation history filtering", () => {
  const today = new Date("2026-07-21T12:00:00.000Z");
  const observations = [
    createObservation("old", "2026-07-01", "2026-07-20"),
    createObservation("new", "2026-07-20", "2026-07-30"),
  ];

  it("derives overdue status from the due date", () => {
    expect(getEffectiveVerificationStatus(observations[0], today)).toBe("overdue");
    expect(getEffectiveVerificationStatus(observations[1], today)).toBe("pending");
  });

  it("filters pending and overdue records independently", () => {
    const base = { keyword: "", dateFrom: "", dateTo: "", questionGroupId: "" };
    expect(filterObservations(observations, { ...base, verificationStatus: "overdue" }, today).map((item) => item.id)).toEqual(["old"]);
    expect(filterObservations(observations, { ...base, verificationStatus: "pending" }, today).map((item) => item.id)).toEqual(["new"]);
  });

  it("supports keyword and date-range filters", () => {
    const result = filterObservations(observations, {
      keyword: "乙方", dateFrom: "2026-07-15", dateTo: "2026-07-31",
      questionGroupId: "g1", verificationStatus: "",
    }, today);
    expect(result.map((item) => item.id)).toEqual(["new"]);
  });
});
