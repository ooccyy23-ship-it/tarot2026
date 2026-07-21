import type { QuestionGroup } from "../types/questionGroup";

export type CustomQuestionGroupInput = {
  category: string;
  title: string;
  description: string;
  questions: Array<{ title: string; description: string }>;
};

export function validateCustomQuestionGroup(input: CustomQuestionGroupInput): string[] {
  const errors: string[] = [];
  if (!input.category.trim()) errors.push("請輸入題組分類。");
  if (!input.title.trim()) errors.push("請輸入題組名稱。");
  if (input.questions.length !== 5) errors.push("題組必須包含五個問題。");
  if (input.questions.some((question) => !question.title.trim())) errors.push("五個問題名稱都必須填寫。");
  return errors;
}

export function createCustomQuestionGroup(input: CustomQuestionGroupInput, now = new Date()): QuestionGroup {
  const errors = validateCustomQuestionGroup(input);
  if (errors.length > 0) throw new Error(errors.join(" "));

  const timestamp = now.toISOString();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `custom-${now.getTime()}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    category: input.category.trim(),
    title: input.title.trim(),
    description: input.description.trim() || undefined,
    source: "custom",
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    questions: input.questions.map((question, index) => ({
      id: `${id}-q${index + 1}`,
      order: index + 1,
      title: question.title.trim(),
      description: question.description.trim() || undefined,
    })),
  };
}
