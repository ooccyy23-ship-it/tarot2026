import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../features/auth/useAuth";
import { CompletedDrawSummary } from "../features/draw/components/CompletedDrawSummary";
import { FiveCardDrawModule } from "../features/draw/components/FiveCardDrawModule";
import { getResearchSessionStatusLabel } from "../features/researchSessions/constants/researchSessionLabels";
import { ResearchEventSection } from "../features/researchSessions/components/ResearchEventSection";
import { ResearchValidationSection } from "../features/researchSessions/components/ResearchValidationSection";
import { ResearchSessionStepBar } from "../features/researchSessions/components/ResearchSessionStepBar";
import {
  buildLockedResearchSetResult,
  createResearchDrawContext,
  getResearchSetConfig,
  materializeResearchQuestions,
  researchSetResultToDrawResult,
  type ResearchDrawContext,
} from "../features/researchSessions/logic/researchSessionDraw";
import { getSevenDaySessionService } from "../features/researchSessions/storage/sevenDaySessionService";
import { getResearchEventService } from "../features/researchSessions/storage/researchEventService";
import { getResearchValidationService } from "../features/researchSessions/storage/researchValidationService";
import type { ResearchQuestionValidationInput } from "../features/researchSessions/logic/researchSessionValidation";
import type { ResearchEventInput } from "../features/researchSessions/logic/researchSessionEvents";
import type {
  ResearchEventRecord,
  ResearchQuestionValidationRecord,
  ResearchSession,
  ResearchSetCode,
} from "../features/researchSessions/types/researchSession";
import type { DrawResult } from "../features/observations/types/observation";

function localDateInput(now = new Date()): string {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function SevenDayResearchPage({ sessionId }: { sessionId?: string }) {
  const { user, initializing, actionLoading, signInWithGoogle } = useAuth();
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [events, setEvents] = useState<ResearchEventRecord[]>([]);
  const [validations, setValidations] = useState<ResearchQuestionValidationRecord[]>([]);
  const [startDate, setStartDate] = useState(localDateInput);
  const [drawContext, setDrawContext] = useState<ResearchDrawContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const writeInFlight = useRef(false);

  const loadSessions = useCallback(async (preferredSessionId?: string) => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const service = getSevenDaySessionService();
      const listed = await service.list();
      setSessions(listed);
      const selectedId = preferredSessionId
        ?? sessionId
        ?? activeSession?.sessionId
        ?? listed.find((item) => item.status !== "invalid" && item.status !== "completed")?.sessionId
        ?? listed[0]?.sessionId;
      if (!selectedId) {
        setActiveSession(null);
        setEvents([]);
        setValidations([]);
        return;
      }
      const [session, sessionEvents, sessionValidations] = await Promise.all([
        service.get(selectedId),
        getResearchEventService().list(selectedId),
        getResearchValidationService().list(selectedId),
      ]);
      setActiveSession(session ?? null);
      setEvents(sessionEvents);
      setValidations(sessionValidations);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "讀取研究 Session 失敗。");
    } finally {
      setLoading(false);
    }
  }, [activeSession?.sessionId, sessionId, user]);

  useEffect(() => {
    setSessions([]);
    setActiveSession(null);
    setEvents([]);
    setValidations([]);
    setDrawContext(null);
    if (user) void loadSessions(sessionId);
  }, [sessionId, user?.uid]);

  const runWrite = useCallback(async (operation: () => Promise<void>) => {
    if (writeInFlight.current) return;
    writeInFlight.current = true;
    setLoading(true);
    setError("");
    try {
      await operation();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Session 操作失敗，請稍後再試。";
      setError(message);
      throw reason;
    } finally {
      writeInFlight.current = false;
      setLoading(false);
    }
  }, []);

  const handleCreate = () => runWrite(async () => {
    const service = getSevenDaySessionService();
    const created = await service.create(startDate);
    if (created.session.status === "draft") {
      await service.updateStatus(created.session.sessionId, "drawing");
    }
    await loadSessions(created.session.sessionId);
  });

  const handleStartExistingDraft = () => runWrite(async () => {
    if (!activeSession) return;
    await getSevenDaySessionService().updateStatus(activeSession.sessionId, "drawing");
    await loadSessions(activeSession.sessionId);
  });

  const handleSetComplete = async (
    setId: ResearchSetCode,
    result: DrawResult,
  ): Promise<void> => {
    if (!activeSession || !drawContext) throw new Error("缺少本題組的抽牌時間。");
    const config = getResearchSetConfig(setId);
    const lockedResult = buildLockedResearchSetResult(config, drawContext, result);
    await runWrite(async () => {
      const service = getSevenDaySessionService();
      await service.saveLockedSet(activeSession.sessionId, lockedResult);
      const refreshed = await service.get(activeSession.sessionId);
      if (!refreshed) throw new Error("保存後無法重新讀取 Session。");
      setActiveSession(refreshed);
      setSessions((current) => current.map((item) => (
        item.sessionId === refreshed.sessionId ? refreshed : item
      )));
      setDrawContext(null);
    });
  };

  const handleEventSave = async (
    input: ResearchEventInput,
    eventId?: string,
  ): Promise<void> => {
    if (!activeSession) throw new Error("缺少目前的研究 Session。");
    await runWrite(async () => {
      const eventService = getResearchEventService();
      if (eventId) {
        await eventService.update(activeSession.sessionId, eventId, input);
      } else {
        await eventService.create(activeSession.sessionId, input);
      }
      setEvents(await eventService.list(activeSession.sessionId));
    });
  };

  const handleEnterValidation = () => runWrite(async () => {
    if (!activeSession) return;
    await getSevenDaySessionService().updateStatus(activeSession.sessionId, "validation_due");
    await loadSessions(activeSession.sessionId);
  });

  const handleValidationSave = async (
    setId: ResearchSetCode,
    questionIndex: number,
    input: ResearchQuestionValidationInput,
  ): Promise<void> => {
    if (!activeSession) throw new Error("請先選擇研究 Session。");
    await runWrite(async () => {
      const service = getResearchValidationService();
      await service.save(activeSession.sessionId, setId, questionIndex, input);
      setValidations(await service.list(activeSession.sessionId));
    });
  };

  const handleValidationComplete = () => runWrite(async () => {
    if (!activeSession) return;
    await getResearchValidationService().complete(activeSession.sessionId);
    await loadSessions(activeSession.sessionId);
  });

  const currentConfig = useMemo(() => (
    activeSession?.status === "drawing"
      ? getResearchSetConfig(activeSession.currentSet)
      : null
  ), [activeSession?.currentSet, activeSession?.status]);
  const currentQuestions = useMemo(
    () => currentConfig ? materializeResearchQuestions(currentConfig) : [],
    [currentConfig],
  );

  if (initializing) {
    return <main className="content-page"><section className="panel"><p>正在確認登入狀態…</p></section></main>;
  }

  if (!user) {
    return (
      <main className="content-page">
        <header className="page-title">
          <div><p className="eyebrow">7 天研究</p><h1>三題組研究 Session</h1></div>
        </header>
        <section className="panel empty-state">
          <h2>請先登入</h2>
          <p>研究 Session 與 15 張鎖定牌卡會保存到你的 Firestore 帳號。</p>
          <button className="primary-button" type="button" disabled={actionLoading} onClick={() => void signInWithGoogle()}>
            使用 Google 登入
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="content-page research-session-page">
      <header className="page-title">
        <div>
          <p className="eyebrow">7 天研究</p>
          <h1>三題組研究 Session</h1>
          <p>A 主動聯繫 → B 現實互動 → C 關係推進；每組各自取得時間並產生五張牌。</p>
        </div>
        {sessionId ? <a className="secondary-button" href="#/research">返回研究列表</a> : null}
      </header>

      {error ? <StatusMessage tone="error" message={`資料寫入失敗：${error}`} /> : null}

      <section className={`research-session-layout ${sessionId ? "detail-only" : ""}`}>
        {!sessionId ? <aside className="panel research-session-sidebar">
          <div className="section-heading">
            <p className="eyebrow">Sessions</p>
            <h2>研究紀錄</h2>
          </div>
          <label className="field-group">
            <span className="field-label">開始日期</span>
            <input className="text-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <button className="primary-button" type="button" disabled={loading || !startDate} onClick={() => void handleCreate().catch(() => undefined)}>
            {loading ? "處理中…" : "建立／開啟 Session"}
          </button>
          <div className="research-session-list">
            {sessions.map((session) => (
              <button
                className={activeSession?.sessionId === session.sessionId ? "is-active" : ""}
                key={session.sessionId}
                type="button"
                disabled={loading}
                onClick={() => void loadSessions(session.sessionId)}
              >
                <strong>{session.sessionId}</strong>
                <span>{getResearchSessionStatusLabel(session.status)}・{session.completedSets.length}/3 組</span>
              </button>
            ))}
          </div>
        </aside> : null}

        <div className="research-session-main">
          {!activeSession ? (
            <section className="panel empty-state">
              <h2>尚未建立研究 Session</h2>
              <p>選擇開始日期後建立第一筆 7 天研究。</p>
            </section>
          ) : (
            <>
              <section className="panel research-session-summary">
                <div>
                  <p className="eyebrow">{activeSession.sessionId}</p>
                  <h2>{activeSession.subject}・7 天三題組研究</h2>
                  <p>{activeSession.startDate} 至 {activeSession.validationDeadline}</p>
                </div>
                <span className={`status-chip ${activeSession.status}`}>
                  {getResearchSessionStatusLabel(activeSession.status)}
                </span>
              </section>

              <ResearchSessionStepBar session={activeSession} />

              <ol className="research-set-progress" aria-label="題組完成進度">
                {(["A", "B", "C"] as const).map((setId) => {
                  const config = getResearchSetConfig(setId);
                  const completed = activeSession.completedSets.includes(setId);
                  const current = activeSession.status === "drawing" && activeSession.currentSet === setId;
                  return (
                    <li className={completed ? "completed" : current ? "current" : "locked"} key={setId}>
                      <span>{setId}</span>
                      <div><strong>{config.questionGroup.title}</strong><small>{completed ? "已鎖定" : current ? "可開始" : "尚未開放"}</small></div>
                    </li>
                  );
                })}
              </ol>

              {(["A", "B", "C"] as const).map((setId) => {
                const config = getResearchSetConfig(setId);
                const lockedResult = activeSession.groupDrawResults.find(
                  (result) => result.setId === setId,
                );
                const isCurrent = activeSession.status === "drawing"
                  && activeSession.currentSet === setId;
                return (
                  <section className="research-set-detail" id={`research-set-${setId}`} key={setId}>
                    <div className="section-heading research-set-detail-heading">
                      <div>
                        <p className="eyebrow">題組 {setId}</p>
                        <h2>{config.questionGroup.title}</h2>
                      </div>
                      <span className={`status-chip ${lockedResult ? "completed" : isCurrent ? "drawing" : "draft"}`}>
                        {lockedResult ? "題組鎖定" : isCurrent ? "抽牌進行中" : "尚未開放"}
                      </span>
                    </div>

                    {lockedResult ? (
                      <CompletedDrawSummary
                        result={researchSetResultToDrawResult(lockedResult)}
                        questions={lockedResult.questionGroupSnapshot.questions}
                      />
                    ) : isCurrent ? (
                      <div className="research-current-set">
                        <div className="panel research-current-set-header">
                          <div>
                            <h3>{config.questionGroup.title}</h3>
                            <p>{config.questionGroup.description}</p>
                          </div>
                          {!drawContext ? (
                            <button
                              className="primary-button"
                              type="button"
                              disabled={loading}
                              onClick={() => setDrawContext(createResearchDrawContext())}
                            >
                              取得現在時間並開始
                            </button>
                          ) : (
                            <button
                              className="ghost-button"
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                if (window.confirm("更換開始時間會清除本題組尚未儲存的操作，確定嗎？")) {
                                  setDrawContext(createResearchDrawContext());
                                }
                              }}
                            >
                              更換開始時間
                            </button>
                          )}
                        </div>
                        {drawContext ? (
                          <FiveCardDrawModule
                            key={`${activeSession.sessionId}-${setId}-${drawContext.drawTimestamp}`}
                            fixedTime={drawContext.drawTime}
                            fixedWeekday={drawContext.weekday}
                            questions={currentQuestions}
                            lockAfterComplete
                            onComplete={(result) => handleSetComplete(setId, result)}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div className="panel research-set-unavailable">
                        <strong>尚未開放</strong>
                        <p>請先完成前一個題組並鎖定結果。</p>
                      </div>
                    )}
                  </section>
                );
              })}

              {/* Legacy locked-set rendering retained in history; integrated sections render above.
                <section className="research-locked-set" key={setResult.setId}>
                  <div className="section-heading">
                    <p className="eyebrow">題組 {setResult.setId}・已鎖定</p>
                    <h2>{setResult.setName}</h2>
                  </div>
                  <CompletedDrawSummary
                    result={researchSetResultToDrawResult(setResult)}
                    questions={setResult.questionGroupSnapshot.questions}
                  />
                </section>
              */}

              {activeSession.status === "draft" ? (
                <section className="panel empty-state">
                  <h2>Session 已建立</h2>
                  <p>開始後將依序開放 A、B、C；正式結果一旦寫入就不可重抽。</p>
                  <button className="primary-button" type="button" disabled={loading} onClick={() => void handleStartExistingDraft().catch(() => undefined)}>
                    開始題組 A
                  </button>
                </section>
              ) : null}

              {/* Legacy current-set rendering replaced by the integrated A/B/C sections.
                <section className="research-current-set">
                  <div className="panel research-current-set-header">
                    <div>
                      <p className="eyebrow">目前題組 {currentConfig.code}</p>
                      <h2>{currentConfig.questionGroup.title}</h2>
                      <p>{currentConfig.questionGroup.description}</p>
                    </div>
                    {!drawContext ? (
                      <button
                        className="primary-button"
                        type="button"
                        disabled={loading}
                        onClick={() => setDrawContext(createResearchDrawContext())}
                      >
                        取得目前時間並開始
                      </button>
                    ) : (
                      <button
                        className="ghost-button"
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          if (window.confirm("重新取得時間將清除本題組尚未保存的操作，是否繼續？")) {
                            setDrawContext(createResearchDrawContext());
                          }
                        }}
                      >
                        重新取得目前時間
                      </button>
                    )}
                  </div>
                  {drawContext ? (
                    <FiveCardDrawModule
                      key={`${activeSession.sessionId}-${currentConfig.code}-${drawContext.drawTimestamp}`}
                      fixedTime={drawContext.drawTime}
                      fixedWeekday={drawContext.weekday}
                      questions={currentQuestions}
                      lockAfterComplete
                      onComplete={(result) => handleSetComplete(currentConfig.code, result)}
                    />
                  ) : null}
                </section>
              */}

              {activeSession.status === "observing" ? (
                <section className="panel empty-state">
                  <h2>三個題組已全部完成</h2>
                  <p>15 張牌均已鎖定，Session 已進入「觀測中」，可開始記錄研究期間內的現實事件。</p>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={loading}
                    onClick={() => void handleEnterValidation().catch(() => undefined)}
                  >
                    檢查期限並進入最終驗證
                  </button>
                </section>
              ) : null}

              {activeSession.status === "observing"
              || activeSession.status === "validation_due"
              || activeSession.status === "completed"
              || activeSession.status === "invalid" ? (
                <ResearchEventSection
                  key={activeSession.sessionId}
                  session={activeSession}
                  events={events}
                  saving={loading}
                  onSave={handleEventSave}
                />
              ) : null}

              {activeSession.status === "validation_due"
              || activeSession.status === "completed" ? (
                <ResearchValidationSection
                  key={`${activeSession.sessionId}-validation`}
                  session={activeSession}
                  events={events}
                  validations={validations}
                  saving={loading}
                  onSave={handleValidationSave}
                  onComplete={handleValidationComplete}
                />
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
