import { describe, expect, it } from "vitest";
import { createDrawResultImportDraft } from "./drawResultImport";
import type { DrawCard } from "../../../types/tarot";

const cards: DrawCard[] = Array.from({ length: 5 }, (_, index) => ({
  order: index + 1,
  sequenceKey: `s${index + 1}` as DrawCard["sequenceKey"],
  sequenceValue: index + 10,
  formattedSequence: String(index + 10),
  mapping: { sequence: index + 10, cardNumber: index, cardName: ["愚者", "魔術師", "女祭司", "皇后", "皇帝"][index] },
  orientationResult: { coinSide: index % 2 ? "tails" : "heads", orientation: index % 2 ? "reversed" : "upright", startedAt: "a", stoppedAt: "b", durationMs: 1, locked: true },
}));

describe("createDrawResultImportDraft", () => {
  it("carries five structured cards without parsing text", () => {
    const draft = createDrawResultImportDraft({ observationDate: new Date(2026, 7, 12), drawTime: "22:24", weekday: "wednesday", cards, questionGroupName: "正式題組", questions: Array.from({ length: 5 }, (_, index) => ({ id: `q${index + 1}`, order: index + 1, title: `正式問題${index + 1}` })) });
    expect(draft.importSource).toBe("draw_result");
    expect(draft.records).toHaveLength(5);
    expect(draft.records[1]).toMatchObject({ questionText: "正式問題2", sequence: 11, cardName: "魔術師", orientation: "reversed" });
    expect(draft.drawResultId).toBe("OBS-20260812-2224");
  });

  it("marks absent questions for confirmation instead of inventing them", () => {
    const draft = createDrawResultImportDraft({ observationDate: new Date(2026, 7, 12), drawTime: "22:24", weekday: "wednesday", cards });
    expect(draft.records[0].questionText).toBe("待補充");
    expect(draft.records[0].issues[0]).toMatchObject({ severity: "warning", code: "question_needs_confirmation" });
  });
});
