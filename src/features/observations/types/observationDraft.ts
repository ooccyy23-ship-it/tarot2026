import type { QuestionGroup } from "../../questionGroups/types/questionGroup";
import type { DrawResult } from "./observation";

export type ObservationDraft = {
  currentStep: 1 | 2 | 3 | 4;
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
  drawResult: DrawResult | null;
  interpretations: Array<{ questionId: string; text: string }>;
  overallInterpretation: {
    summary: string;
    primaryJudgment: string;
    uncertainties: string;
  };
};
