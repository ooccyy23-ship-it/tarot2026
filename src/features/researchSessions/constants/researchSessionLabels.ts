import type {
  ResearchSessionStatus,
  ResearchVerificationResult,
} from "../types/researchSession";

export const researchSessionStatusLabels: Record<ResearchSessionStatus, string> = {
  draft: "草稿",
  drawing: "抽牌中",
  observing: "觀測中",
  validation_due: "待驗證",
  completed: "已完成",
  invalid: "無效",
};

export const researchVerificationResultLabels: Record<ResearchVerificationResult, string> = {
  matched: "符合",
  partial: "部分符合",
  not_matched: "不符合",
  undetermined: "無法判定",
  not_applicable: "不適用",
};

export function getResearchSessionStatusLabel(status: ResearchSessionStatus): string {
  return researchSessionStatusLabels[status];
}

export function getResearchVerificationResultLabel(result: ResearchVerificationResult): string {
  return researchVerificationResultLabels[result];
}
