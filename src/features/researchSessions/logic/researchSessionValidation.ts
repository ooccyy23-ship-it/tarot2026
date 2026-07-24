import {
  calculateQuestionGroupHitRate,
  calculateSessionHitRate,
  countValidVerificationQuestions,
  getVerificationScore,
} from "./researchSessionCalculations";
import type {
  QuestionGroupVerificationResult,
  ResearchQuestionValidationRecord,
  ResearchSession,
  ResearchSetCode,
  ResearchValidationSummary,
  ResearchVerificationResult,
  SessionQuestionGroupDrawResult,
} from "../types/researchSession";

export type ResearchQuestionValidationInput = {
  validationStatus: ResearchVerificationResult;
  evidence: string;
  note?: string;
};

export const researchValidationStatuses: readonly ResearchVerificationResult[] = [
  "matched",
  "partial",
  "not_matched",
  "undetermined",
  "not_applicable",
];

export function validationDocumentId(setId: ResearchSetCode, questionIndex: number): string {
  return `${setId}-${questionIndex}`;
}

export function validateQuestionValidationInput(
  session: Pick<ResearchSession, "status" | "completedSets">,
  input: ResearchQuestionValidationInput,
): string[] {
  const errors: string[] = [];
  if (session.status !== "validation_due") {
    errors.push("只有待驗證狀態可以儲存正式驗證結果。");
  }
  if (session.completedSets.length !== 3) {
    errors.push("三個題組必須全部抽牌並鎖定。");
  }
  if (!researchValidationStatuses.includes(input.validationStatus)) {
    errors.push("驗證結果不正確。");
  }
  if (!input.evidence.trim()) {
    errors.push("驗證依據為必填。");
  }
  return errors;
}

export function normalizeQuestionValidationInput(
  input: ResearchQuestionValidationInput,
): ResearchQuestionValidationInput {
  return {
    validationStatus: input.validationStatus,
    evidence: input.evidence.trim(),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
  };
}

function asGroupResult(
  setResult: SessionQuestionGroupDrawResult,
  records: readonly ResearchQuestionValidationRecord[],
): QuestionGroupVerificationResult {
  return {
    groupKey: setResult.groupKey,
    questionGroupId: setResult.questionGroupId,
    questions: records
      .filter((record) => record.setId === setResult.setId)
      .map((record) => ({
        questionId: record.cardSnapshot.questionId,
        result: record.validationStatus,
      })),
  };
}

function scoreTotal(records: readonly ResearchQuestionValidationRecord[]): number {
  return records.reduce(
    (total, record) => total + (getVerificationScore(record.validationStatus) ?? 0),
    0,
  );
}

export function summarizeQuestionGroupValidation(
  setResult: SessionQuestionGroupDrawResult,
  records: readonly ResearchQuestionValidationRecord[],
): ResearchValidationSummary {
  const group = asGroupResult(setResult, records);
  return {
    score: scoreTotal(records.filter((record) => record.setId === setResult.setId)),
    validQuestionCount: countValidVerificationQuestions(group.questions),
    hitRate: calculateQuestionGroupHitRate(group),
  };
}

export function summarizeSessionValidation(
  setResults: readonly SessionQuestionGroupDrawResult[],
  records: readonly ResearchQuestionValidationRecord[],
): ResearchValidationSummary {
  const groups = setResults.map((setResult) => asGroupResult(setResult, records));
  const questions = groups.flatMap((group) => group.questions);
  return {
    score: scoreTotal(records),
    validQuestionCount: countValidVerificationQuestions(questions),
    hitRate: calculateSessionHitRate(groups),
  };
}

export function summarizeValidationRecords(
  records: readonly ResearchQuestionValidationRecord[],
): ResearchValidationSummary {
  const validScores = records
    .map((record) => getVerificationScore(record.validationStatus))
    .filter((score): score is number => score !== null);
  const score = validScores.reduce((total, value) => total + value, 0);
  return {
    score,
    validQuestionCount: validScores.length,
    hitRate: validScores.length === 0 ? null : score / validScores.length,
  };
}

export function getMissingValidationQuestions(
  setResults: readonly SessionQuestionGroupDrawResult[],
  records: readonly ResearchQuestionValidationRecord[],
): string[] {
  const completed = new Set(
    records.map((record) => validationDocumentId(record.setId, record.questionIndex)),
  );
  return setResults.flatMap((setResult) => setResult.cards
    .filter((card) => !completed.has(validationDocumentId(setResult.setId, card.questionIndex)))
    .map((card) => `題組 ${setResult.setId} 第 ${card.questionIndex} 題`));
}

export function canCompleteResearchSession(
  session: Pick<ResearchSession, "status" | "completedSets">,
  setResults: readonly SessionQuestionGroupDrawResult[],
  records: readonly ResearchQuestionValidationRecord[],
): boolean {
  return session.status === "validation_due"
    && session.completedSets.length === 3
    && setResults.length === 3
    && records.length === 15
    && getMissingValidationQuestions(setResults, records).length === 0;
}
