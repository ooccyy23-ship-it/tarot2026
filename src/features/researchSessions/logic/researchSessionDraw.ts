import { weekdayOrder } from "../../draw/logic/drawFlow";
import type { DrawResult } from "../../observations/types/observation";
import type { ObservationQuestion } from "../../questionGroups/types/questionGroup";
import {
  researchSubjectToken,
  sevenDayQuestionGroups,
} from "../constants/sevenDayQuestionGroups";
import type {
  ResearchSessionStatus,
  ResearchSetCode,
  SessionQuestionGroupDrawResult,
  SevenDayQuestionGroupConfig,
} from "../types/researchSession";

const setOrder: readonly ResearchSetCode[] = ["A", "B", "C"];

export type ResearchDrawContext = {
  drawDate: string;
  drawTime: string;
  drawTimestamp: string;
  weekday: SessionQuestionGroupDrawResult["weekday"];
};

export function getNextResearchSet(completedSets: readonly ResearchSetCode[]): ResearchSetCode | null {
  return setOrder.find((setId) => !completedSets.includes(setId)) ?? null;
}

export function canOpenResearchSet(
  setId: ResearchSetCode,
  completedSets: readonly ResearchSetCode[],
): boolean {
  return getNextResearchSet(completedSets) === setId;
}

export function advanceResearchDrawProgress(
  status: ResearchSessionStatus,
  completedSets: readonly ResearchSetCode[],
  setId: ResearchSetCode,
): {
  completedSets: ResearchSetCode[];
  currentSet: ResearchSetCode;
  status: "drawing" | "observing";
} {
  if (status !== "drawing") {
    throw new Error("Session 目前不在抽牌狀態，不能新增題組結果。");
  }
  const expectedSet = getNextResearchSet(completedSets);
  if (expectedSet !== setId) {
    throw new Error(`題組必須依序完成，目前應抽題組 ${expectedSet ?? "無"}。`);
  }
  const nextCompletedSets = [...completedSets, setId];
  const nextSet = getNextResearchSet(nextCompletedSets);
  return {
    completedSets: nextCompletedSets,
    currentSet: nextSet ?? "C",
    status: nextSet ? "drawing" : "observing",
  };
}

export function getResearchSetConfig(setId: ResearchSetCode): SevenDayQuestionGroupConfig {
  const config = sevenDayQuestionGroups.find((item) => item.code === setId);
  if (!config) throw new Error(`找不到研究題組 ${setId}。`);
  return config;
}

export function materializeResearchQuestions(
  config: SevenDayQuestionGroupConfig,
  subject = "小峰",
): ObservationQuestion[] {
  const replaceSubject = (value: string): string => value.split(researchSubjectToken).join(subject);
  return config.questionGroup.questions
    .map((question) => ({
      id: question.id,
      order: question.order,
      title: replaceSubject(question.title),
      ...(question.description
        ? { description: replaceSubject(question.description) }
        : {}),
    }))
    .sort((a, b) => a.order - b.order);
}

export function createResearchDrawContext(now = new Date()): ResearchDrawContext {
  if (Number.isNaN(now.getTime())) throw new Error("無法取得有效的裝置時間。");
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const drawTime = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join(":");
  return {
    drawDate: localDate,
    drawTime,
    drawTimestamp: now.toISOString(),
    weekday: weekdayOrder[now.getDay()],
  };
}

export function buildLockedResearchSetResult(
  config: SevenDayQuestionGroupConfig,
  context: ResearchDrawContext,
  drawResult: DrawResult,
  lockedAt = new Date().toISOString(),
): SessionQuestionGroupDrawResult {
  const questions = materializeResearchQuestions(config);
  if (drawResult.cards.length !== 5 || drawResult.sequences.length !== 5) {
    throw new Error("題組必須包含完整五張牌與五個序號。");
  }
  if (drawResult.drawTime !== context.drawTime) {
    throw new Error("抽牌結果時間與本題組開始時間不一致。");
  }
  if (weekdayOrder[drawResult.selectedWeekday] !== context.weekday) {
    throw new Error("抽牌結果星期與本題組裝置時間不一致。");
  }

  return {
    setId: config.code,
    setName: config.questionGroup.title,
    researchCore: config.dimension,
    groupKey: config.key,
    questions: questions.map((question) => question.title),
    questionGroupId: config.questionGroup.id,
    questionGroupSnapshot: {
      ...config.questionGroup,
      questions,
    },
    drawDate: context.drawDate,
    drawTime: context.drawTime,
    drawTimestamp: context.drawTimestamp,
    weekday: context.weekday,
    sequences: [...drawResult.sequences],
    cards: drawResult.cards.map((card, index) => ({
      questionIndex: index + 1,
      questionId: questions[index].id,
      questionText: questions[index].title,
      sequence: card.sequence,
      cardId: card.cardNumber,
      cardNameZh: card.cardName,
      cardNameEn: "",
      orientation: card.orientation,
      orientationLabel: card.orientationLabel,
      imageUrl: "",
      coinSide: card.coinSide,
      startedAt: card.startedAt,
      stoppedAt: card.stoppedAt,
      durationMs: card.durationMs,
    })),
    isLocked: true,
    lockedAt,
  };
}

export function researchSetResultToDrawResult(
  result: SessionQuestionGroupDrawResult,
): DrawResult {
  return {
    drawTime: result.drawTime,
    selectedWeekday: weekdayOrder.indexOf(result.weekday),
    sequences: [...result.sequences],
    completedAt: result.lockedAt,
    cards: result.cards.map((card) => ({
      position: card.questionIndex,
      questionId: card.questionId,
      sequence: card.sequence,
      cardNumber: card.cardId,
      cardName: card.cardNameZh,
      coinSide: card.coinSide,
      orientation: card.orientation,
      orientationLabel: card.orientationLabel,
      startedAt: card.startedAt,
      stoppedAt: card.stoppedAt,
      durationMs: card.durationMs,
    })),
  };
}
