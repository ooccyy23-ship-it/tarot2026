import type { DrawResult } from "../../observations/types/observation";
import type { QuestionGroup } from "../../questionGroups/types/questionGroup";

export type ResearchQuestionGroupKey = "communication" | "interaction" | "progress";
export type ResearchSetCode = "A" | "B" | "C";

export type ResearchSessionStatus =
  | "draft"
  | "drawing"
  | "observing"
  | "validation_due"
  | "completed"
  | "invalid";

export type ResearchVerificationResult =
  | "matched"
  | "partial"
  | "not_matched"
  | "undetermined"
  | "not_applicable";

export type SevenDayQuestionGroupConfig = {
  key: ResearchQuestionGroupKey;
  code: ResearchSetCode;
  dimension: "Communication" | "Interaction" | "Progress";
  questionGroup: QuestionGroup;
};

export type SessionQuestionGroupDrawResult = {
  groupKey: ResearchQuestionGroupKey;
  questionGroupId: string;
  questionGroupSnapshot: QuestionGroup;
  drawResult?: DrawResult;
  completedAt?: string;
};

export type ResearchEventRecord = {
  id: string;
  occurredAt: string;
  title: string;
  description?: string;
  evidenceSources?: string[];
  relatedGroupKeys?: ResearchQuestionGroupKey[];
  createdAt: string;
  updatedAt: string;
};

export type QuestionVerificationResult = {
  questionId: string;
  result: ResearchVerificationResult;
  note?: string;
  evidenceEventIds?: string[];
  verifiedAt?: string;
};

export type QuestionGroupVerificationResult = {
  groupKey: ResearchQuestionGroupKey;
  questionGroupId: string;
  questions: QuestionVerificationResult[];
};

export type ResearchSession = {
  sessionId: string;
  schemaVersion: 1;
  ownerId: string;
  sessionType: "seven_day_three_sets";
  subject: "小峰";
  relationshipScope: "我和小峰之間的感情互動";
  startDate: string;
  validationDeadline: string;
  status: ResearchSessionStatus;
  currentSet: ResearchSetCode;
  completedSets: ResearchSetCode[];
  totalCards: 15;
  groupDrawResults: SessionQuestionGroupDrawResult[];
  events: ResearchEventRecord[];
  verificationResults: QuestionGroupVerificationResult[];
  createdAt: Date | null;
  updatedAt: Date | null;
  completedAt: Date | null;
  invalidReason: string | null;
};
