import type {
  QuestionGroupVerificationResult,
  QuestionVerificationResult,
  ResearchVerificationResult,
} from "../types/researchSession";

const validationScores: Record<ResearchVerificationResult, number | null> = {
  matched: 1,
  partial: 0.5,
  not_matched: 0,
  undetermined: null,
  not_applicable: null,
};

function parseCalendarDate(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("日期格式必須為 YYYY-MM-DD。");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new Error("開始日不是有效日期。");
  }
  return { year, month, day };
}

function formatCalendarDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateValidationDueDate(startDate: string): string {
  const { year, month, day } = parseCalendarDate(startDate);
  const dueDate = new Date(Date.UTC(year, month - 1, day + 7));
  return formatCalendarDate(dueDate);
}

export function getVerificationScore(result: ResearchVerificationResult): number | null {
  return validationScores[result];
}

export function countValidVerificationQuestions(results: readonly QuestionVerificationResult[]): number {
  return results.filter((item) => getVerificationScore(item.result) !== null).length;
}

export function calculateQuestionGroupHitRate(
  result: QuestionGroupVerificationResult,
): number | null {
  const scores = result.questions
    .map((item) => getVerificationScore(item.result))
    .filter((score): score is number => score !== null);
  if (scores.length === 0) return null;
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

export function calculateSessionHitRate(
  results: readonly QuestionGroupVerificationResult[],
): number | null {
  const questions = results.flatMap((group) => group.questions);
  const validCount = countValidVerificationQuestions(questions);
  if (validCount === 0) return null;
  const score = questions.reduce(
    (total, question) => total + (getVerificationScore(question.result) ?? 0),
    0,
  );
  return score / validCount;
}
