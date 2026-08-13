import { getResearchSessionStatusLabel } from "../constants/researchSessionLabels";
import type { ResearchSessionStatus } from "../types/researchSession";

export function ResearchStatusBadge({ status }: { status: ResearchSessionStatus }) {
  return <span className={`status-chip research-status ${status}`}>{getResearchSessionStatusLabel(status)}</span>;
}
