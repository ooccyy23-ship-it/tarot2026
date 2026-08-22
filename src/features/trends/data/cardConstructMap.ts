import { tarotCardCatalog } from "../../../data/tarotCardCatalog";
import { tarotCardStableId } from "../../records/logic/tarotRecordNavigation";
import type { CardConstructMapping, TrendConstructId } from "../types/trendAnalysis";

// Only mappings explicitly supported by the supplied research specification belong here.
// Missing N Model meanings intentionally remain UNASSIGNED rather than being inferred.
const EXPLICIT_MAPPINGS: Partial<Record<string, TrendConstructId>> = {
  TAROT_48: "EMOTIONAL_CONNECTION", // 聖杯皇后 — explicit example supplied in the specification.
};

export const CARD_CONSTRUCT_MAPPINGS: CardConstructMapping[] = tarotCardCatalog.map((card) => {
  const cardId = tarotCardStableId(card.order);
  const category = EXPLICIT_MAPPINGS[cardId] ?? "UNASSIGNED";
  return {
    cardId,
    cardName: card.name,
    category,
    source: category === "UNASSIGNED" ? "unavailable" : "explicit_requirement",
  };
});

export const CARD_CONSTRUCT_BY_NAME = Object.fromEntries(CARD_CONSTRUCT_MAPPINGS.map((item) => [item.cardName, item])) as Record<string, CardConstructMapping>;

export function validateCardConstructMappings(mappings = CARD_CONSTRUCT_MAPPINGS): { valid: boolean; errors: string[]; mapped: number; unassigned: number } {
  const errors: string[] = [];
  const ids = new Set<string>();
  mappings.forEach((mapping) => {
    if (ids.has(mapping.cardId)) errors.push(`重複牌卡 ID：${mapping.cardId}`);
    ids.add(mapping.cardId);
  });
  tarotCardCatalog.forEach((card) => {
    const id = tarotCardStableId(card.order);
    if (!ids.has(id)) errors.push(`缺少牌卡映射：${id}`);
  });
  return {
    valid: errors.length === 0 && mappings.length === tarotCardCatalog.length,
    errors,
    mapped: mappings.filter((item) => item.category !== "UNASSIGNED").length,
    unassigned: mappings.filter((item) => item.category === "UNASSIGNED").length,
  };
}
