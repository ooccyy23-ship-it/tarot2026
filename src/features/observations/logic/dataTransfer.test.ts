import { describe, expect, it, vi } from "vitest";
import type { QuestionGroup } from "../../questionGroups/types/questionGroup";
import type { Observation } from "../types/observation";
import { importDataFromJson, parseImportJson, serializeData, type DataSnapshot, type ImportRepository } from "./dataTransfer";

function createGroup(): QuestionGroup {
  return { id: "g1", category: "測試", title: "五題題組", source: "custom", active: true, createdAt: "2026-07-01", updatedAt: "2026-07-01", questions: Array.from({ length: 5 }, (_, index) => ({ id: `q${index + 1}`, order: index + 1, title: `問題 ${index + 1}` })) };
}

function createObservation(group = createGroup()): Observation {
  return {
    id: "o1", schemaVersion: 1, observationDate: "2026-07-01", drawTime: "09:00",
    createdAt: "2026-07-01T01:00:00.000Z", updatedAt: "2026-07-01T01:00:00.000Z", weekday: 2, weekdayLabel: "星期二",
    questionGroupId: group.id, questionGroupSnapshot: group,
    preEmotion: { primaryEmotion: "平靜", expectationLevel: 5, anxietyLevel: 5, calmLevel: 5 },
    drawResult: { drawTime: "09:00", selectedWeekday: 2, sequences: [1, 2, 3, 4, 5], completedAt: "2026-07-01T01:05:00.000Z", cards: group.questions.map((question, index) => ({ position: index + 1, questionId: question.id, sequence: index + 1, cardNumber: index + 1, cardName: `牌 ${index + 1}`, coinSide: "heads", orientation: "upright", orientationLabel: "正位", startedAt: "", stoppedAt: "", durationMs: 1 })) },
    interpretations: [], overallInterpretation: {}, verification: { requirement: "uncertain", status: "pending" },
  };
}

function createSnapshot(): DataSnapshot {
  const group = createGroup();
  return { observations: [createObservation(group)], questionGroups: [group], settings: [{ key: "theme", value: "light", updatedAt: "2026-07-01T01:00:00.000Z" }] };
}

function createRepository(current: DataSnapshot) {
  return {
    snapshot: vi.fn(async () => current),
    saveObservation: vi.fn(async (_observation: Observation) => undefined),
    saveQuestionGroup: vi.fn(async (_group: QuestionGroup) => undefined),
    saveSetting: vi.fn(async (_key: string, _value: unknown) => undefined),
  } satisfies ImportRepository;
}

describe("JSON data transfer", () => {
  const now = new Date("2026-07-21T12:00:00.000Z");

  it("keeps observations, question groups and setting values consistent after export and parse", () => {
    const snapshot = createSnapshot();
    const parsed = parseImportJson(serializeData(snapshot, now));
    expect(parsed.observations).toEqual(snapshot.observations);
    expect(parsed.questionGroups).toEqual(snapshot.questionGroups);
    expect(parsed.settings).toEqual(snapshot.settings);
    expect(parsed.skipped).toBe(0);
  });

  it("does not read or overwrite existing data when JSON is invalid", async () => {
    const repository = createRepository(createSnapshot());
    await expect(importDataFromJson("not-json", repository, now)).rejects.toThrow("既有資料未變更");
    expect(repository.snapshot).not.toHaveBeenCalled();
    expect(repository.saveObservation).not.toHaveBeenCalled();
    expect(repository.saveQuestionGroup).not.toHaveBeenCalled();
    expect(repository.saveSetting).not.toHaveBeenCalled();
  });

  it("creates a backup and skips a malformed item without losing valid records", async () => {
    const snapshot = createSnapshot();
    const bundle = JSON.parse(serializeData(snapshot, now));
    bundle.observations.push({ id: "invalid", schemaVersion: 99 });
    const repository = createRepository(snapshot);
    const result = await importDataFromJson(JSON.stringify(bundle), repository, now);
    expect(result.skipped).toBe(1);
    expect(repository.saveSetting.mock.calls[0][0]).toBe("import-backup-2026-07-21T12:00:00.000Z");
    expect(repository.saveObservation).toHaveBeenCalledTimes(1);
    expect(repository.saveQuestionGroup).toHaveBeenCalledTimes(1);
  });
});
