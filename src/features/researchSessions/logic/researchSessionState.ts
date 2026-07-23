import type { ResearchSessionStatus } from "../types/researchSession";

export const allowedResearchSessionTransitions: Record<
  ResearchSessionStatus,
  readonly ResearchSessionStatus[]
> = {
  draft: ["drawing", "invalid"],
  drawing: ["observing", "invalid"],
  observing: ["validation_due", "invalid"],
  validation_due: ["completed", "invalid"],
  completed: [],
  invalid: [],
};

export function canTransitionResearchSession(
  currentStatus: ResearchSessionStatus,
  nextStatus: ResearchSessionStatus,
): boolean {
  return allowedResearchSessionTransitions[currentStatus].includes(nextStatus);
}

export function assertResearchSessionTransition(
  currentStatus: ResearchSessionStatus,
  nextStatus: ResearchSessionStatus,
): void {
  if (!canTransitionResearchSession(currentStatus, nextStatus)) {
    throw new Error(`Session 狀態不可由 ${currentStatus} 轉為 ${nextStatus}。`);
  }
}
