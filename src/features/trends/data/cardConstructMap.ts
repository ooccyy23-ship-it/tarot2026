import { tarotCardCatalog } from "../../../data/tarotCardCatalog";
import { tarotCardStableId } from "../../records/logic/tarotRecordNavigation";
import type { CardConstructMapping } from "../types/trendAnalysis";
import { N_MODEL_CONSTRUCT_BY_NAME } from "./nModelConstructDictionary";

export const CARD_CONSTRUCT_MAPPINGS: CardConstructMapping[] = tarotCardCatalog.map((card) => {
  const cardId = tarotCardStableId(card.order);
  const dictionaryEntry = N_MODEL_CONSTRUCT_BY_NAME[card.name];
  const category = dictionaryEntry?.category ?? "UNASSIGNED";
  return {
    cardId,
    cardName: card.name,
    category,
    source: dictionaryEntry ? "n_model_dictionary" : "unavailable",
    primaryConstruct: dictionaryEntry?.primaryConstruct,
    domain: dictionaryEntry?.domain,
    sourceBatch: dictionaryEntry?.sourceBatch,
    sourceVersion: dictionaryEntry?.sourceVersion,
    reviewVersion: dictionaryEntry?.reviewVersion,
    reviewStatus: dictionaryEntry?.reviewStatus,
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
