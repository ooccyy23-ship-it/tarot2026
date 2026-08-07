import { tarotCardCatalog } from "../../../data/tarotCardCatalog";
import type { ParsedTarotRecord } from "../types/tarotRecord";

export type TarotCooccurrenceCard = {
  cardName: string;
  groupCount: number;
};

export type TarotCooccurrenceMatrix = {
  cards: TarotCooccurrenceCard[];
  counts: number[][];
  maxCount: number;
  totalGroups: number;
};

export type TarotCooccurrenceGroup = {
  groupId: string;
  groupTitle: string;
  observationDate: string;
  observationTime: string;
  records: ParsedTarotRecord[];
};

const cardOrder = new Map(tarotCardCatalog.map((card) => [card.name, card.order]));

function groupRecords(records: ParsedTarotRecord[]): Map<string, ParsedTarotRecord[]> {
  const groups = new Map<string, ParsedTarotRecord[]>();
  records.forEach((record) => {
    const group = groups.get(record.groupId) ?? [];
    group.push(record);
    groups.set(record.groupId, group);
  });
  return groups;
}

function uniqueCardNames(records: ParsedTarotRecord[]): Set<string> {
  return new Set(records.map((record) => record.normalizedCardName).filter(Boolean));
}

export function calculateTarotCooccurrenceMatrix(
  records: ParsedTarotRecord[],
  limit = 8,
): TarotCooccurrenceMatrix {
  const groups = groupRecords(records);
  const groupCounts = new Map<string, number>();

  groups.forEach((group) => {
    uniqueCardNames(group).forEach((cardName) => {
      groupCounts.set(cardName, (groupCounts.get(cardName) ?? 0) + 1);
    });
  });

  const cards = [...groupCounts.entries()]
    .map(([cardName, groupCount]) => ({ cardName, groupCount }))
    .sort((left, right) => right.groupCount - left.groupCount
      || (cardOrder.get(left.cardName) ?? Number.MAX_SAFE_INTEGER) - (cardOrder.get(right.cardName) ?? Number.MAX_SAFE_INTEGER)
      || left.cardName.localeCompare(right.cardName, "zh-Hant"))
    .slice(0, Math.max(0, limit));

  const indexByCard = new Map(cards.map((card, index) => [card.cardName, index]));
  const counts = cards.map(() => cards.map(() => 0));

  groups.forEach((group) => {
    const selectedIndexes = [...uniqueCardNames(group)]
      .map((cardName) => indexByCard.get(cardName))
      .filter((index): index is number => index !== undefined);
    selectedIndexes.forEach((leftIndex, position) => {
      selectedIndexes.slice(position + 1).forEach((rightIndex) => {
        counts[leftIndex][rightIndex] += 1;
        counts[rightIndex][leftIndex] += 1;
      });
    });
  });

  return {
    cards,
    counts,
    maxCount: Math.max(0, ...counts.flat()),
    totalGroups: groups.size,
  };
}

export function findTarotCooccurrenceGroups(
  records: ParsedTarotRecord[],
  firstCardName: string,
  secondCardName: string,
): TarotCooccurrenceGroup[] {
  return [...groupRecords(records).entries()]
    .filter(([, group]) => {
      const names = uniqueCardNames(group);
      return names.has(firstCardName) && names.has(secondCardName);
    })
    .map(([groupId, group]) => {
      const first = group[0];
      return {
        groupId,
        groupTitle: first.groupTitle,
        observationDate: first.observationDate,
        observationTime: first.observationTime,
        records: [...group].sort((left, right) => left.questionOrder - right.questionOrder),
      };
    })
    .sort((left, right) => `${right.observationDate}T${right.observationTime}`.localeCompare(`${left.observationDate}T${left.observationTime}`));
}
