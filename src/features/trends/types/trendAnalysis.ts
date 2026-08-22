import type { ParsedTarotRecord } from "../../records/types/tarotRecord";

export type TrendConstructId =
  | "EMOTIONAL_CONNECTION"
  | "EMOTIONAL_LOSS"
  | "COGNITIVE_PROCESSING"
  | "DEFENSE_LIMITATION"
  | "WAITING_EVALUATION"
  | "ACTION_MOMENTUM"
  | "RELATIONSHIP_STRUCTURE"
  | "TRANSFORMATION_CHANGE"
  | "STABILITY_HOLDING"
  | "UNCERTAINTY";

export type TrendMappingCategory = TrendConstructId | "UNASSIGNED";
export type TrendDirection = "BASELINE" | "NEW" | "UP" | "DOWN" | "STABLE" | "NO_DATA";
export type NModelDomain = "META" | "MOTIVATION" | "EMOTION" | "COGNITION" | "REALITY_RESOURCE";

export type TrendConstructDefinition = {
  id: TrendConstructId;
  label: string;
  color: string;
  order: number;
};

export type CardConstructMapping = {
  cardId: string;
  cardName: string;
  category: TrendMappingCategory;
  source: "explicit_requirement" | "n_model_dictionary" | "unavailable";
  primaryConstruct?: string;
  domain?: NModelDomain;
  sourceBatch?: "major_arcana_22" | "wands_14" | "cups_14" | "swords_14" | "pentacles_14";
  sourceVersion?: "v1.0";
  reviewVersion?: "v1.0-RC1";
  reviewStatus?: "release_candidate";
};

export type TrendPeriodStrategy = {
  id: string;
  label: string;
  getWindow(dateKey: string): { start: string; end: string };
};

export type ConstructMetric = {
  constructId: TrendConstructId;
  count: number;
  share: number | null;
  changePp: number | null;
  direction: TrendDirection;
};

export type TrendPeriod = {
  id: string;
  periodStart: string;
  periodEnd: string;
  canonicalStart: string;
  canonicalEnd: string;
  isPartial: boolean;
  totalCards: number;
  mappedCards: number;
  totalQuestionGroups: number;
  constructMetrics: Record<TrendConstructId, ConstructMetric>;
  topConstructs: TrendConstructId[];
  secondaryConstructs: TrendConstructId[];
  unassignedCount: number;
  unassignedShare: number;
  records: ParsedTarotRecord[];
};

export type TrendCardDetail = {
  cardId: string;
  cardName: string;
  count: number;
  constructShare: number;
  groupCount: number;
};

export type TrendSummary = {
  currentTop: { ids: TrendConstructId[]; share: number } | null;
  currentTopChange: number | null;
  sustainedRise: { ids: TrendConstructId[]; periods: number } | null;
  largestDrop: { ids: TrendConstructId[]; changePp: number } | null;
};

export type TrendAnalysisResult = {
  periods: TrendPeriod[];
  summary: TrendSummary;
  coverage: { mappedCatalogCards: number; unassignedCatalogCards: number; mappedRecordCards: number; unassignedRecordCards: number };
};
