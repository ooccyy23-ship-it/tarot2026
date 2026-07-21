import type { QuestionGroup } from "../../questionGroups/types/questionGroup";

export type DrawnCard = {
  position: number;
  questionId: string;
  sequence: number;
  cardNumber: number | string;
  cardName: string;
  coinSide: "heads" | "tails";
  orientation: "upright" | "reversed";
  orientationLabel: "正位" | "逆位";
  startedAt: string;
  stoppedAt: string;
  durationMs: number;
};

export type DrawResult = {
  drawTime: string;
  selectedWeekday: number;
  sequences: number[];
  cards: DrawnCard[];
  completedAt: string;
};

export type Observation = {
  id: string;
  schemaVersion: 1;
  observationDate: string;
  drawTime: string;
  createdAt: string;
  updatedAt: string;
  subjectAlias?: string;
  topic?: string;
  contextNote?: string;
  weekday: number;
  weekdayLabel: string;
  questionGroupId: string;
  questionGroupSnapshot: QuestionGroup;
  preEmotion: {
    primaryEmotion: string;
    expectationLevel: number;
    anxietyLevel: number;
    calmLevel: number;
    expectedResult?: string;
    fearedResult?: string;
    note?: string;
  };
  drawResult: DrawResult;
  interpretations: { questionId: string; text: string }[];
  overallInterpretation: {
    summary?: string;
    primaryJudgment?: string;
    uncertainties?: string;
  };
  verification: {
    requirement: "required" | "not_required" | "uncertain";
    status: "pending" | "verified" | "overdue" | "not_applicable";
    prediction?: string;
    dueDate?: string;
    criteria?: string;
    expectedEvent?: string;
    evidenceSources?: string[];
    actualEvent?: string;
    result?: "matched" | "partially_matched" | "not_matched" | "unclear";
    verifiedAt?: string;
    reflection?: string;
  };
};
