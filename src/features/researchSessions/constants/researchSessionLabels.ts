import type {
  ResearchSessionStatus,
  ResearchVerificationResult,
} from "../types/researchSession";

export const researchSessionStatusLabels: Record<ResearchSessionStatus, string> = {
  draft: "尚未開始",
  drawing: "抽牌進行中",
  observing: "觀察中",
  validation_due: "待驗證",
  completed: "已完成",
  invalid: "已失效",
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
