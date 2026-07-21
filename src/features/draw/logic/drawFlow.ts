import weekdayMappings from "../../../data/weekdayMappings.json";
import { getWeekdayLabel } from "../../../logic/weekday";
import type { DrawCard, SequenceKey, SequenceResult, WeekdayKey, WeekdayMappings } from "../../../types/tarot";
import type { DrawResult } from "../../observations/types/observation";
import type { ObservationQuestion } from "../../questionGroups/types/questionGroup";

export const sequenceOrder: SequenceKey[] = ["s1", "s2", "s3", "s4", "s5"];
export const weekdayOrder: WeekdayKey[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function parseTimeInput(value: string): { hour: number; minute: number } | null {
  const digits = value.replace(":", "");
  if (digits.length !== 4) return null;

  const hour = Number(digits.slice(0, 2));
  const minute = Number(digits.slice(2, 4));
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function buildDrawCards(
  sequenceResult: SequenceResult,
  weekday: WeekdayKey,
  existingCards: DrawCard[] = [],
): DrawCard[] {
  const mappings = (weekdayMappings as WeekdayMappings)[weekday];

  return sequenceOrder.map((sequenceKey, index) => {
    const sequenceValue = sequenceResult.values[sequenceKey];
    const mapping = mappings.find((item) => item.sequence === sequenceValue);
    if (!mapping) throw new Error(`找不到 ${getWeekdayLabel(weekday)} 的序號 ${sequenceValue} 對照資料`);

    const existingCard = existingCards.find((card) => card.sequenceKey === sequenceKey);
    return {
      order: index + 1,
      sequenceKey,
      sequenceValue,
      formattedSequence: sequenceResult.formattedValues[sequenceKey],
      mapping,
      orientationResult: existingCard?.orientationResult ?? null,
    };
  });
}

export function buildDrawResult(
  drawTime: string,
  weekday: WeekdayKey,
  sequenceResult: SequenceResult,
  cards: DrawCard[],
  questions: ObservationQuestion[],
  completedAt = new Date().toISOString(),
): DrawResult {
  const orderedQuestions = [...questions].sort((a, b) => a.order - b.order);
  if (orderedQuestions.length !== 5 || cards.length !== 5) {
    throw new Error("抽牌結果必須包含五個問題與五張牌。");
  }
  if (cards.some((card) => !card.orientationResult?.locked)) {
    throw new Error("五張牌全部完成前不可建立 DrawResult。");
  }

  return {
    drawTime,
    selectedWeekday: weekdayOrder.indexOf(weekday),
    sequences: sequenceOrder.map((key) => sequenceResult.values[key]),
    completedAt,
    cards: cards.map((card, index) => {
      const orientation = card.orientationResult!;
      return {
        position: index + 1,
        questionId: orderedQuestions[index].id,
        sequence: card.sequenceValue,
        cardNumber: card.mapping.cardNumber,
        cardName: card.mapping.cardName,
        coinSide: orientation.coinSide,
        orientation: orientation.orientation,
        orientationLabel: orientation.orientation === "upright" ? "正位" : "逆位",
        startedAt: orientation.startedAt,
        stoppedAt: orientation.stoppedAt,
        durationMs: orientation.durationMs,
      };
    }),
  };
}

export function buildCopyText(drawTime: string, weekday: WeekdayKey, cards: DrawCard[]): string {
  const lines = cards.map((card) => {
    const orientation = card.orientationResult?.orientation === "upright" ? "正位" : "逆位";
    return `${card.order}. 序號${card.formattedSequence}｜${card.mapping.cardName}｜${orientation}`;
  });
  return [`抽牌時間：${drawTime}`, `對照表：${getWeekdayLabel(weekday)}`, "", ...lines].join("\n");
}
