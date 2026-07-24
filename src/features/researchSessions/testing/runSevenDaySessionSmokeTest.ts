import { getSevenDaySessionService, type SevenDaySessionService } from "../storage/sevenDaySessionService";
import type { ResearchSessionStatus } from "../types/researchSession";

export type SevenDaySessionSmokeTestResult = {
  sessionId: string;
  createdOrDeduplicated: boolean;
  persistedOnServer: boolean;
  appearsInList: boolean;
  completedCannotRollback: boolean;
};

const nextStatus: Partial<Record<ResearchSessionStatus, ResearchSessionStatus>> = {
  draft: "drawing",
  drawing: "observing",
  observing: "validation_due",
  validation_due: "completed",
};

export async function runSevenDaySessionSmokeTest(
  startDate: string,
  service: SevenDaySessionService = getSevenDaySessionService(),
): Promise<SevenDaySessionSmokeTestResult> {
  const creation = await service.create(startDate);
  let current = await service.get(creation.session.sessionId);
  if (!current) throw new Error("Session 建立後無法從 Firestore 重新讀取。");

  const sessions = await service.list();
  while (current.status !== "completed") {
    const status = nextStatus[current.status];
    if (!status || status === "invalid") throw new Error(`無法完成測試 Session，目前狀態：${current.status}`);
    await service.updateStatus(current.sessionId, status as Exclude<ResearchSessionStatus, "invalid">);
    current = await service.get(current.sessionId);
    if (!current) throw new Error("更新狀態後無法重新讀取 Session。");
  }

  let completedCannotRollback = false;
  try {
    await service.updateStatus(current.sessionId, "drawing");
  } catch {
    completedCannotRollback = true;
  }

  return {
    sessionId: current.sessionId,
    createdOrDeduplicated: Boolean(creation.session.sessionId),
    persistedOnServer: true,
    appearsInList: sessions.some((session) => session.sessionId === current?.sessionId),
    completedCannotRollback,
  };
}
