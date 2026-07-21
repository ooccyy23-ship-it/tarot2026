import type { DrawResult } from "../types/observation";
import type { ObservationDraft } from "../types/observationDraft";

export function attachDrawResultOnce(draft: ObservationDraft, result: DrawResult): ObservationDraft {
  if (draft.drawResult) return draft;
  const questionIds = draft.questionGroupSnapshot?.questions.map((question) => question.id) ?? [];
  return {
    ...draft,
    currentStep: 3,
    drawResult: structuredClone(result),
    interpretations: questionIds.map((questionId) => ({
      questionId,
      text: draft.interpretations.find((item) => item.questionId === questionId)?.text ?? "",
    })),
  };
}
