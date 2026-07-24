import { useCallback, useRef, useState } from "react";
import type { ResearchSessionStatus } from "../types/researchSession";
import { getSevenDaySessionService } from "../storage/sevenDaySessionService";

export function useSevenDaySessionActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const writeInFlight = useRef(false);

  const runWrite = useCallback(async <T,>(operation: () => Promise<T>): Promise<T | undefined> => {
    if (writeInFlight.current) return undefined;
    writeInFlight.current = true;
    setLoading(true);
    setError("");
    try {
      return await operation();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Session 操作失敗，請稍後再試。");
      return undefined;
    } finally {
      writeInFlight.current = false;
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(
    (startDate: string) => runWrite(() => getSevenDaySessionService().create(startDate)),
    [runWrite],
  );

  const updateStatus = useCallback(
    (sessionId: string, nextStatus: Exclude<ResearchSessionStatus, "invalid">) =>
      runWrite(() => getSevenDaySessionService().updateStatus(sessionId, nextStatus)),
    [runWrite],
  );

  const markInvalid = useCallback(
    (sessionId: string, reason: string) =>
      runWrite(() => getSevenDaySessionService().markInvalid(sessionId, reason)),
    [runWrite],
  );

  return { loading, error, clearError: () => setError(""), createSession, updateStatus, markInvalid };
}
