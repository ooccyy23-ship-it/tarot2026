import { describe, expect, it } from "vitest";
import type { DrawCard, SequenceResult } from "../../../types/tarot";
import type { ObservationQuestion } from "../../questionGroups/types/questionGroup";
import { buildDrawResult, formatTimeInput, parseTimeInput } from "./drawFlow";

const sequenceResult: SequenceResult = {
  hour: 9,
  minute: 55,
  values: { s1: 55, s2: 64, s3: 49, s4: 6, s5: 39 },
  formattedValues: { s1: "55", s2: "64", s3: "49", s4: "06", s5: "39" },
  explanations: { s1: "", s2: "", s3: [], s4: [], s5: "" },
};

const questions: ObservationQuestion[] = Array.from({ length: 5 }, (_, index) => ({
  id: `q${index + 1}`,
  order: index + 1,
  title: `問題 ${index + 1}`,
}));

const cards: DrawCard[] = [55, 64, 49, 6, 39].map((sequence, index) => ({
  order: index + 1,
  sequenceKey: `s${index + 1}` as DrawCard["sequenceKey"],
  sequenceValue: sequence,
  formattedSequence: String(sequence).padStart(2, "0"),
  mapping: { sequence, cardNumber: index + 1, cardName: `牌 ${index + 1}` },
  orientationResult: {
    coinSide: index % 2 === 0 ? "heads" : "tails",
    orientation: index % 2 === 0 ? "upright" : "reversed",
    startedAt: "2026-07-21T12:00:00.000Z",
    stoppedAt: "2026-07-21T12:00:01.000Z",
    durationMs: 1000,
    locked: true,
  },
}));

describe("draw flow adapter", () => {
  it("preserves the existing HH:MM parsing behavior", () => {
    expect(formatTimeInput("0955")).toBe("09:55");
    expect(parseTimeInput("09:55")).toEqual({ hour: 9, minute: 55 });
    expect(parseTimeInput("23:60")).toBeNull();
  });

  it("maps five ordered questions to five completed cards", () => {
    const result = buildDrawResult("09:55", "tuesday", sequenceResult, cards, questions, "2026-07-21T12:05:00.000Z");
    expect(result.sequences).toEqual([55, 64, 49, 6, 39]);
    expect(result.selectedWeekday).toBe(2);
    expect(result.cards.map((card) => card.questionId)).toEqual(["q1", "q2", "q3", "q4", "q5"]);
    expect(result.cards.map((card) => card.orientationLabel)).toEqual(["正位", "逆位", "正位", "逆位", "正位"]);
  });

  it("rejects an incomplete five-card result", () => {
    expect(() => buildDrawResult("09:55", "tuesday", sequenceResult, cards.slice(0, 4), questions)).toThrow();
    const unlocked = cards.map((card, index) => index === 4 ? { ...card, orientationResult: null } : card);
    expect(() => buildDrawResult("09:55", "tuesday", sequenceResult, unlocked, questions)).toThrow();
  });
});
