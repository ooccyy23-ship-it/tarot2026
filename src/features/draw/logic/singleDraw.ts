import weekdayMappings from "../../../data/weekdayMappings.json";
import { getWeekdayLabel } from "../../../logic/weekday";
import type { DrawCard, SingleSequenceResult, WeekdayKey, WeekdayMappings } from "../../../types/tarot";

export function calculateSingleSequence(hour: number, minute: number): SingleSequenceResult {
  const sum = hour + minute;
  const usedSubtraction = sum > 78;
  const sequence = usedSubtraction ? minute - hour : sum;

  return {
    hour,
    minute,
    sum,
    sequence,
    formattedSequence: String(sequence).padStart(2, "0"),
    usedSubtraction,
    explanation: usedSubtraction
      ? `${hour} + ${minute} = ${sum}，大於 78，因此改以 ${minute} − ${hour} = ${sequence}。`
      : `${hour} + ${minute} = ${sequence}。`,
  };
}

export function getSingleSequenceIssue(result: SingleSequenceResult): string | null {
  if (result.sequence < 1 || result.sequence > 78) {
    return `單抽序號 ${result.sequence} 不在有效範圍 1～78 內，請改用其他有效時間。`;
  }
  return null;
}

export function buildSingleDrawCard(
  result: SingleSequenceResult,
  weekday: WeekdayKey,
  existingCard?: DrawCard,
): DrawCard {
  const mappings = (weekdayMappings as WeekdayMappings)[weekday];
  const mapping = mappings.find((item) => item.sequence === result.sequence);
  if (!mapping) {
    throw new Error(`找不到 ${getWeekdayLabel(weekday)} 的序號 ${result.sequence} 對照資料`);
  }

  return {
    order: 1,
    sequenceKey: "s1",
    sequenceValue: result.sequence,
    formattedSequence: result.formattedSequence,
    mapping,
    orientationResult: existingCard?.orientationResult ?? null,
  };
}

export function buildSingleCopyText(drawTime: string, weekday: WeekdayKey, card: DrawCard): string {
  const orientation = card.orientationResult?.orientation === "upright" ? "正位" : "逆位";
  return [
    "塔羅單抽結果",
    `抽牌時間：${drawTime}`,
    `對照表：${getWeekdayLabel(weekday)}`,
    `序號：${card.formattedSequence}`,
    `牌卡：${card.mapping.cardName}`,
    `正逆位：${orientation}`,
  ].join("\n");
}
