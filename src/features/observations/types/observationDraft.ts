import type { QuestionGroup } from "../../questionGroups/types/questionGroup";

export type ObservationDraft = {
  observationDate: string;
  drawTime: string;
  subjectAlias: string;
  topic: string;
  contextNote: string;
  weekday: number;
  questionGroupId: string;
  questionGroupSnapshot: QuestionGroup | null;
  preEmotion: {
    primaryEmotion: string;
    customEmotion: string;
    expectationLevel: number;
    anxietyLevel: number;
    calmLevel: number;
    expectedResult: string;
    fearedResult: string;
    note: string;
  };
};
