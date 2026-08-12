import { getTarotCardMetadata } from "../../../data/tarotCardCatalog";
import { createObservationId } from "../../draw/logic/observationMetadata";
import type { ObservationQuestion } from "../../questionGroups/types/questionGroup";
import type { DrawCard, WeekdayKey } from "../../../types/tarot";
import { getWeekdayLabel } from "../../../logic/weekday";
import type { ParsedTarotGroupDraft, TarotRecordParseIssue } from "../types/tarotRecord";
import { createTarotRecordFingerprint } from "./tarotRecordFingerprint";

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type DrawResultImportInput = {
  observationDate: Date;
  drawTime: string;
  weekday: WeekdayKey;
  cards: DrawCard[];
  questions?: ObservationQuestion[];
  questionGroupId?: string;
  questionGroupName?: string;
};

export function createDrawResultImportDraft(input: DrawResultImportInput): ParsedTarotGroupDraft {
  const observationDate = localDate(input.observationDate);
  const drawResultId = createObservationId(input.observationDate, input.drawTime);
  const groupTitle = input.questionGroupName?.trim() || "待補充";
  const orderedQuestions = [...(input.questions ?? [])].sort((a, b) => a.order - b.order);
  const createdAt = new Date().toISOString();
  const records = input.cards.map((card, index) => {
    const question = orderedQuestions[index];
    const questionText = question?.title.trim() || "待補充";
    const metadata = getTarotCardMetadata(card.mapping.cardName);
    const issues: TarotRecordParseIssue[] = [];
    if (!question) issues.push({
      code: "question_needs_confirmation",
      severity: "warning",
      field: "questionText",
      questionOrder: index + 1,
      message: `第${index + 1}題沒有正式題目，已標示為待補充。`,
    });
    return {
      id: `${drawResultId}-${String(index + 1).padStart(2, "0")}`,
      groupId: drawResultId,
      observationDate,
      observationTime: input.drawTime,
      observationDateTime: `${observationDate}T${input.drawTime}:00`,
      groupTitle,
      questionOrder: index + 1,
      questionText,
      sequence: card.sequenceValue,
      cardName: card.mapping.cardName,
      normalizedCardName: metadata?.name,
      arcanaType: metadata?.arcanaType,
      suit: metadata?.suit,
      rank: metadata?.rank,
      orientation: card.orientationResult?.orientation ?? "upright",
      orientationLabel: card.orientationResult?.orientation === "reversed" ? "逆位" as const : "正位" as const,
      createdAt,
      issues,
    };
  });
  const draft: ParsedTarotGroupDraft = {
    groupId: drawResultId,
    groupTitle,
    observationDate,
    observationTime: input.drawTime,
    observationDateTime: `${observationDate}T${input.drawTime}:00`,
    originalDateText: `${observationDate} ${input.drawTime}`,
    importSource: "draw_result",
    drawResultId,
    sourceQuestionGroupId: input.questionGroupId,
    drawMode: "five",
    weekdayLabel: getWeekdayLabel(input.weekday),
    sequences: input.cards.map((card) => card.sequenceValue),
    records,
  };
  draft.fingerprint = createTarotRecordFingerprint(draft);
  return draft;
}
