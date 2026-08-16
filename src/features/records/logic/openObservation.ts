import { getTarotCardMetadata } from "../../../data/tarotCardCatalog";
import { createTarotRecordFingerprint } from "./tarotRecordFingerprint";
import type { ParsedTarotGroup, TarotOrientation, TarotRecordImportSource } from "../types/tarotRecord";

export type OpenObservationCardInput = {
  position: number;
  serialNumber: number | null;
  cardName: string;
  orientation: TarotOrientation | "";
};

export type OpenObservationInput = {
  source: TarotRecordImportSource;
  observationDate: string;
  drawTime: string;
  weekdayLabel: string;
  drawMethod: string;
  note: string;
  cards: OpenObservationCardInput[];
};

export function createOpenObservationCode(date: string, time: string): string {
  return `OBS-${date.replace(/-/g, "")}-${time.replace(":", "")}`;
}

export function validateOpenObservation(input: OpenObservationInput): string[] {
  const errors: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.observationDate)) errors.push("請輸入有效的觀測日期。");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.drawTime)) errors.push("請輸入有效的抽牌時間（HH:MM）。");
  if (!input.drawMethod.trim()) errors.push("請填寫抽牌方式。");
  if (input.cards.length !== 5) errors.push("無題觀測必須正好包含五張牌。");
  input.cards.forEach((card, index) => {
    if (card.position !== index + 1) errors.push(`第 ${index + 1} 個位置資料不正確。`);
    if (!getTarotCardMetadata(card.cardName)) errors.push(`位置 ${index + 1} 尚未選擇有效牌卡。`);
    if (card.orientation !== "upright" && card.orientation !== "reversed") errors.push(`位置 ${index + 1} 尚未選擇正逆位。`);
    if (card.serialNumber !== null && (!Number.isInteger(card.serialNumber) || card.serialNumber < 1 || card.serialNumber > 78)) {
      errors.push(`位置 ${index + 1} 的序號必須為 1 至 78，或留空。`);
    }
  });
  return errors;
}

export function buildOpenObservationGroup(input: OpenObservationInput, now = new Date()): ParsedTarotGroup {
  const errors = validateOpenObservation(input);
  if (errors.length) throw new Error(errors.join("\n"));
  const observationCode = createOpenObservationCode(input.observationDate, input.drawTime);
  const createdAt = now.toISOString();
  const records = input.cards.map((card) => {
    const metadata = getTarotCardMetadata(card.cardName)!;
    return {
      id: `${observationCode}-${String(card.position).padStart(2, "0")}`,
      groupId: observationCode,
      observationDate: input.observationDate,
      observationTime: input.drawTime,
      observationDateTime: `${input.observationDate}T${input.drawTime}:00`,
      groupTitle: "",
      questionOrder: card.position,
      position: card.position,
      questionText: "",
      sequence: card.serialNumber ?? undefined,
      recordType: "open_observation" as const,
      observationCode,
      weekdayLabel: input.weekdayLabel,
      drawMethod: input.drawMethod.trim(),
      note: input.note.trim(),
      cardName: metadata.name,
      normalizedCardName: metadata.name,
      arcanaType: metadata.arcanaType,
      suit: metadata.suit,
      rank: metadata.rank,
      orientation: card.orientation as TarotOrientation,
      orientationLabel: card.orientation === "upright" ? "正位" as const : "逆位" as const,
      createdAt,
    };
  });
  const group: ParsedTarotGroup = {
    groupId: observationCode,
    groupTitle: "",
    observationDate: input.observationDate,
    observationTime: input.drawTime,
    observationDateTime: `${input.observationDate}T${input.drawTime}:00`,
    originalDateText: `${input.observationDate} ${input.drawTime}`,
    importSource: input.source,
    drawMode: "five",
    weekdayLabel: input.weekdayLabel,
    sequences: input.cards.map((card) => card.serialNumber).filter((value): value is number => value !== null),
    recordType: "open_observation",
    observationCode,
    drawMethod: input.drawMethod.trim(),
    note: input.note.trim(),
    records,
  };
  group.fingerprint = createTarotRecordFingerprint(group);
  return group;
}
