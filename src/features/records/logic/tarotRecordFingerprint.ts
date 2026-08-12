import type { TarotOrientation } from "../types/tarotRecord";

type FingerprintRecord = {
  questionOrder: number;
  cardName: string;
  normalizedCardName?: string;
  orientation: TarotOrientation;
  sequence?: number;
};

type FingerprintGroup = {
  observationDate: string;
  observationTime: string;
  groupTitle: string;
  sourceQuestionGroupId?: string;
  sequences?: number[];
  records: FingerprintRecord[];
};

function hashText(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createTarotRecordFingerprint(group: FingerprintGroup): string {
  const recordSignature = [...group.records]
    .sort((left, right) => left.questionOrder - right.questionOrder)
    .map((record) => [
      record.questionOrder,
      record.normalizedCardName ?? record.cardName.trim(),
      record.orientation,
      record.sequence ?? "",
    ].join(":"))
    .join("|");
  const source = [
    group.observationDate,
    group.observationTime,
    group.sourceQuestionGroupId ?? group.groupTitle.trim(),
    (group.sequences ?? []).join(","),
    recordSignature,
  ].join("||");
  return `fp-${hashText(source)}`;
}

export function createTarotRecordCompatibilityFingerprint(group: FingerprintGroup): string {
  const withoutSequences: FingerprintGroup = {
    ...group,
    sequences: undefined,
    records: group.records.map((record) => ({ ...record, sequence: undefined })),
  };
  return createTarotRecordFingerprint(withoutSequences);
}
