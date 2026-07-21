import type { Observation } from "../../observations/types/observation";

export type EffectiveVerificationStatus = Observation["verification"]["status"];

export function getEffectiveVerificationStatus(observation: Observation, today = new Date()): EffectiveVerificationStatus {
  if (
    observation.verification.status === "pending" &&
    observation.verification.dueDate &&
    observation.verification.dueDate < today.toISOString().slice(0, 10)
  ) return "overdue";
  return observation.verification.status;
}

export const verificationStatusLabels: Record<EffectiveVerificationStatus, string> = {
  pending: "待驗證",
  verified: "已驗證",
  overdue: "已逾期",
  not_applicable: "不需驗證",
};
