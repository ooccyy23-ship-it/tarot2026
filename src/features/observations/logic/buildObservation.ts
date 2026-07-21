import { getWeekdayLabel } from "../../../logic/weekday";
import { weekdayOrder } from "../../draw/logic/drawFlow";
import type { Observation } from "../types/observation";
import type { ObservationDraft } from "../types/observationDraft";

function createId(now: Date): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `observation-${now.getTime()}-${Math.random().toString(36).slice(2)}`;
}

export function validateObservationDraft(draft: ObservationDraft): string[] {
  const errors: string[] = [];
  if (!draft.questionGroupSnapshot || draft.questionGroupSnapshot.questions.length !== 5) errors.push("缺少完整五題題組。");
  if (!draft.drawResult || draft.drawResult.cards.length !== 5) errors.push("缺少完整五張牌結果。");
  if (draft.verification.requirement === "required") {
    if (!draft.verification.prediction?.trim()) errors.push("請填寫可驗證命題。");
    if (!draft.verification.dueDate) errors.push("請填寫驗證期限。");
    if (!draft.verification.criteria?.trim()) errors.push("請填寫判定標準。");
  }
  return errors;
}

export function buildObservation(draft: ObservationDraft, now = new Date()): Observation {
  const errors = validateObservationDraft(draft);
  if (errors.length > 0 || !draft.questionGroupSnapshot || !draft.drawResult) {
    throw new Error(errors.join(" ") || "觀測草稿不完整。");
  }

  const timestamp = now.toISOString();
  const weekday = Math.min(Math.max(draft.weekday, 0), 6);
  const verification = structuredClone(draft.verification);
  verification.status = verification.requirement === "not_required" ? "not_applicable" : "pending";

  return {
    id: createId(now),
    schemaVersion: 1,
    observationDate: draft.observationDate,
    drawTime: draft.drawTime,
    createdAt: timestamp,
    updatedAt: timestamp,
    subjectAlias: draft.subjectAlias.trim() || undefined,
    topic: draft.topic.trim() || undefined,
    contextNote: draft.contextNote.trim() || undefined,
    weekday,
    weekdayLabel: getWeekdayLabel(weekdayOrder[weekday]),
    questionGroupId: draft.questionGroupId,
    questionGroupSnapshot: structuredClone(draft.questionGroupSnapshot),
    preEmotion: {
      primaryEmotion: draft.preEmotion.primaryEmotion === "其他"
        ? draft.preEmotion.customEmotion.trim() || "其他"
        : draft.preEmotion.primaryEmotion,
      expectationLevel: draft.preEmotion.expectationLevel,
      anxietyLevel: draft.preEmotion.anxietyLevel,
      calmLevel: draft.preEmotion.calmLevel,
      expectedResult: draft.preEmotion.expectedResult.trim() || undefined,
      fearedResult: draft.preEmotion.fearedResult.trim() || undefined,
      note: draft.preEmotion.note.trim() || undefined,
    },
    drawResult: structuredClone(draft.drawResult),
    interpretations: structuredClone(draft.interpretations),
    overallInterpretation: {
      summary: draft.overallInterpretation.summary.trim() || undefined,
      primaryJudgment: draft.overallInterpretation.primaryJudgment.trim() || undefined,
      uncertainties: draft.overallInterpretation.uncertainties.trim() || undefined,
    },
    verification,
  };
}

export type EditableObservationText = Pick<Observation, "subjectAlias" | "topic" | "contextNote" | "interpretations" | "overallInterpretation">;

export function updateObservationText(
  observation: Observation,
  updates: EditableObservationText,
  updatedAt = new Date().toISOString(),
): Observation {
  return {
    ...observation,
    subjectAlias: updates.subjectAlias?.trim() || undefined,
    topic: updates.topic?.trim() || undefined,
    contextNote: updates.contextNote?.trim() || undefined,
    interpretations: structuredClone(updates.interpretations),
    overallInterpretation: structuredClone(updates.overallInterpretation),
    updatedAt,
    drawResult: observation.drawResult,
    questionGroupSnapshot: observation.questionGroupSnapshot,
  };
}
