import type { QuestionGroup } from "../../questionGroups/types/questionGroup";
import type { WeekdayKey } from "../../../types/tarot";

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

export type ResearchSessionDrawCard = {
  questionIndex: number;
  questionId: string;
  questionText: string;
  sequence: number;
  cardId: number | string;
  cardNameZh: string;
  cardNameEn: string;
  orientation: "upright" | "reversed";
  orientationLabel: "正位" | "逆位";
  imageUrl: string;
  coinSide: "heads" | "tails";
  startedAt: string;
  stoppedAt: string;
  durationMs: number;
};

export type SessionQuestionGroupDrawResult = {
  setId: ResearchSetCode;
  setName: string;
  researchCore: SevenDayQuestionGroupConfig["dimension"];
  groupKey: ResearchQuestionGroupKey;
  questions: string[];
  questionGroupId: string;
  questionGroupSnapshot: QuestionGroup;
  drawDate: string;
  drawTime: string;
  drawTimestamp: string;
  weekday: WeekdayKey;
  sequences: number[];
  cards: ResearchSessionDrawCard[];
  isLocked: true;
  lockedAt: string;
};

export type ResearchEventType =
  | "直接訊息"
  | "電話"
  | "面對面互動"
  | "社群互動"
  | "第三人相關事件"
  | "主動邀約"
  | "關心或分享"
  | "爭執或誤解"
  | "具體行動"
  | "無互動紀錄"
  | "其他";

export type ResearchEventRecord = {
  eventId: string;
  sessionId: string;
  ownerId: string;
  eventDate: string;
  eventTime?: string;
  eventType: ResearchEventType;
  description: string;
  isDirectInteraction: boolean;
  initiatedByXiaofeng: boolean;
  hasConcreteAction: boolean;
  relatedSets: ResearchSetCode[];
  relatedQuestionIds: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
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

export type ResearchQuestionValidationRecord = {
  setId: ResearchSetCode;
  questionIndex: number;
  questionText: string;
  cardSnapshot: ResearchSessionDrawCard;
  validationStatus: ResearchVerificationResult;
  validationScore: number | null;
  evidence: string;
  note?: string;
  validatedAt: Date | null;
  updatedAt: Date | null;
};

export type ResearchValidationSummary = {
  score: number;
  validQuestionCount: number;
  hitRate: number | null;
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
  validatedQuestionIds: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
  completedAt: Date | null;
  invalidReason: string | null;
};
