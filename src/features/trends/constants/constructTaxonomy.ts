import type { TrendConstructDefinition, TrendConstructId } from "../types/trendAnalysis";

export const TREND_CHANGE_THRESHOLD_PP = 3;

export const TREND_CONSTRUCTS: TrendConstructDefinition[] = [
  { id: "EMOTIONAL_CONNECTION", label: "情感連結", color: "#9b6d78", order: 1 },
  { id: "EMOTIONAL_LOSS", label: "情感失落", color: "#826d78", order: 2 },
  { id: "COGNITIVE_PROCESSING", label: "認知整理", color: "#6f8292", order: 3 },
  { id: "DEFENSE_LIMITATION", label: "防衛限制", color: "#9a765c", order: 4 },
  { id: "WAITING_EVALUATION", label: "等待評估", color: "#aa8d5d", order: 5 },
  { id: "ACTION_MOMENTUM", label: "行動推進", color: "#a6644f", order: 6 },
  { id: "RELATIONSHIP_STRUCTURE", label: "關係結構", color: "#7d7665", order: 7 },
  { id: "TRANSFORMATION_CHANGE", label: "轉化變動", color: "#826d9a", order: 8 },
  { id: "STABILITY_HOLDING", label: "穩定承載", color: "#718267", order: 9 },
  { id: "UNCERTAINTY", label: "不確定性", color: "#8c8580", order: 10 },
];

export const TREND_CONSTRUCT_IDS = TREND_CONSTRUCTS.map((item) => item.id);
export const TREND_CONSTRUCT_BY_ID = Object.fromEntries(TREND_CONSTRUCTS.map((item) => [item.id, item])) as Record<TrendConstructId, TrendConstructDefinition>;
