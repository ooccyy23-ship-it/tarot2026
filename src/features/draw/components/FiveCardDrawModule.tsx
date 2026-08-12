import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CoinFlipCard } from "../../../components/CoinFlipCard";
import { DrawSettings } from "../../../components/DrawSettings";
import { FinalResults } from "../../../components/FinalResults";
import { SequenceResults } from "../../../components/SequenceResults";
import { StatusMessage } from "../../../components/StatusMessage";
import { finalizeCoinFlip } from "../../../logic/flipCoin";
import { generateSequences } from "../../../logic/generateSequences";
import { validateSequences } from "../../../logic/validateSequences";
import { getSystemWeekday, getWeekdayLabel } from "../../../logic/weekday";
import type { DrawCard, OrientationResult, SequenceResult, ValidationIssue, WeekdayKey } from "../../../types/tarot";
import type { DrawResult } from "../../observations/types/observation";
import type { ObservationQuestion } from "../../questionGroups/types/questionGroup";
import { buildCopyText, buildDrawCards, buildDrawResult, formatTimeInput, parseTimeInput } from "../logic/drawFlow";
import { CompletedDrawSummary } from "./CompletedDrawSummary";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { DrawDraftRecoveryPanel } from "./DrawDraftRecoveryPanel";
import {
  clearDraftDraw,
  loadDraftDraw,
  saveDraftDraw,
  type DrawDraftLoadResult,
} from "../storage/drawDraftStorage";

type Props = {
  fixedTime?: string;
  fixedWeekday?: WeekdayKey;
  questions?: ObservationQuestion[];
  completedResult?: DrawResult | null;
  onComplete?: (result: DrawResult) => void | Promise<void>;
  lockAfterComplete?: boolean;
  isActive?: boolean;
  onProgressChange?: (inProgress: boolean) => void;
  draftContextId?: string;
  draftQuestionGroupId?: string;
  draftQuestionGroupName?: string;
};

export function FiveCardDrawModule({
  fixedTime,
  fixedWeekday,
  questions = [],
  completedResult,
  onComplete,
  lockAfterComplete = false,
  isActive = true,
  onProgressChange,
  draftContextId = "draw-tool",
  draftQuestionGroupId,
  draftQuestionGroupName = "一般五抽",
}: Props) {
  const embedded = fixedTime !== undefined && fixedWeekday !== undefined;
  const systemWeekday = useMemo(() => getSystemWeekday(), []);
  const online = useOnlineStatus();
  const [timeInput, setTimeInput] = useState(fixedTime ?? "");
  const [weekday, setWeekday] = useState<WeekdayKey>(fixedWeekday ?? systemWeekday);
  const [formError, setFormError] = useState<string | null>(null);
  const [sequenceResult, setSequenceResult] = useState<SequenceResult | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [cards, setCards] = useState<DrawCard[]>([]);
  const [activeFlipIndex, setActiveFlipIndex] = useState<number | null>(null);
  const [flipStarts, setFlipStarts] = useState<Record<number, string>>({});
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [observationDate, setObservationDate] = useState<Date | null>(null);
  const [completionSaving, setCompletionSaving] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [sequenceCollapsed, setSequenceCollapsed] = useState(false);
  const [coinCollapsed, setCoinCollapsed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operationStatus, setOperationStatus] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [recoveryResult, setRecoveryResult] = useState<DrawDraftLoadResult>({ status: "none" });
  const [recoveryResolved, setRecoveryResolved] = useState(false);
  const completionSent = useRef(false);
  const completionAttempted = useRef(false);
  const pendingCompletion = useRef<DrawResult | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const sequencePanelRef = useRef<HTMLDivElement | null>(null);
  const coinPanelRef = useRef<HTMLElement | null>(null);
  const finalResultsRef = useRef<HTMLDivElement | null>(null);
  const coinButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const previousLockedCount = useRef(0);
  const guideToCoins = useRef(false);
  const successTimer = useRef<number | null>(null);

  useEffect(() => {
    if (fixedTime !== undefined) setTimeInput(fixedTime);
    if (fixedWeekday !== undefined) setWeekday(fixedWeekday);
  }, [fixedTime, fixedWeekday]);

  const allCoinsCompleted = cards.length === 5 && cards.every((card) => card.orientationResult?.locked);
  const lockedCount = cards.filter((card) => card.orientationResult?.locked).length;
  const drawInProgress = Boolean(timeInput || sequenceResult || cards.length > 0 || activeFlipIndex !== null)
    && (!allCoinsCompleted || Boolean(onComplete && !savedAt));
  const showDebugPanel = import.meta.env.DEV;

  useEffect(() => {
    if (!isActive || recoveryResolved || completedResult) return;
    const result = loadDraftDraw(draftContextId);
    if ((result.status === "valid" || result.status === "expired") && result.draft.mode !== "five") {
      setRecoveryResult({ status: "none" });
      setRecoveryResolved(true);
      return;
    }
    if ((result.status === "valid" || result.status === "expired")
      && draftQuestionGroupId && result.draft.questionGroupId !== draftQuestionGroupId) {
      setRecoveryResult({ status: "invalid", errors: ["暫存題組與目前題組不一致。"], raw: JSON.stringify(result.draft) });
      return;
    }
    setRecoveryResult(result);
    setRecoveryResolved(result.status === "none");
  }, [completedResult, draftContextId, draftQuestionGroupId, isActive, recoveryResolved]);

  useEffect(() => {
    if (completedResult) clearDraftDraw(draftContextId);
  }, [completedResult, draftContextId]);

  useEffect(() => {
    if (!isActive || !recoveryResolved || !parseTimeInput(timeInput) || completionSent.current || (embedded && !sequenceResult)) return;
    const shouldSaveCompleted = allCoinsCompleted && Boolean(onComplete);
    if (allCoinsCompleted && !shouldSaveCompleted) return;
    try {
      saveDraftDraw({
        mode: "five",
        contextId: draftContextId,
        questionGroupId: draftQuestionGroupId,
        questionGroupName: draftQuestionGroupName,
        observationDate: (observationDate ?? new Date()).toISOString(),
        drawTime: timeInput,
        weekday,
        sequenceResult,
        validationIssues,
        cards,
        progress: allCoinsCompleted
          ? "awaiting_save"
          : lockedCount > 0
            ? "orientations_in_progress"
            : sequenceResult
              ? "sequences_ready"
              : "time_entered",
      });
      setDraftError(null);
    } catch (reason) {
      setDraftError(reason instanceof Error ? `未完成抽牌暫存失敗：${reason.message}` : "未完成抽牌暫存失敗。");
    }
  }, [allCoinsCompleted, cards, draftContextId, draftQuestionGroupId, draftQuestionGroupName, embedded, isActive, lockedCount, observationDate, onComplete, recoveryResolved, sequenceResult, timeInput, validationIssues, weekday]);

  useEffect(() => {
    if (allCoinsCompleted && !onComplete) clearDraftDraw(draftContextId);
  }, [allCoinsCompleted, draftContextId, onComplete]);

  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(null), 4000);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const showTemporarySuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimer.current !== null) window.clearTimeout(successTimer.current);
    successTimer.current = window.setTimeout(() => setSuccessMessage(null), 1800);
  }, []);

  useEffect(() => () => {
    if (successTimer.current !== null) window.clearTimeout(successTimer.current);
  }, []);

  useEffect(() => {
    onProgressChange?.(drawInProgress);
  }, [drawInProgress, onProgressChange]);

  useEffect(() => {
    if (!isActive || !drawInProgress) return;
    const message = "目前尚未完成五張正逆位判定，離開後本次未完成操作可能遺失。確定要離開嗎？";
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleRouteChange = (event: Event) => {
      if (!window.confirm(message)) event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("tarot:before-route-change", handleRouteChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("tarot:before-route-change", handleRouteChange);
    };
  }, [drawInProgress, isActive]);

  useEffect(() => {
    if (isActive && !embedded && !sequenceResult) {
      window.requestAnimationFrame(() => timeInputRef.current?.focus());
    }
  }, [embedded, isActive, sequenceResult]);

  useEffect(() => {
    if (!guideToCoins.current || cards.length !== 5 || validationIssues.length > 0) return;
    guideToCoins.current = false;
    window.requestAnimationFrame(() => {
      coinPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => coinButtonRefs.current[0]?.focus({ preventScroll: true }), 350);
    });
  }, [cards.length, validationIssues.length]);

  useEffect(() => {
    if (lockedCount <= previousLockedCount.current) {
      previousLockedCount.current = lockedCount;
      return;
    }
    previousLockedCount.current = lockedCount;
    if (lockedCount < 5) {
      showTemporarySuccess(`第 ${lockedCount} 張正逆位判定完成，已解鎖第 ${lockedCount + 1} 張。`);
      window.requestAnimationFrame(() => {
        const nextButton = coinButtonRefs.current[lockedCount];
        nextButton?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        window.setTimeout(() => nextButton?.focus({ preventScroll: true }), 250);
      });
      return;
    }
    setCoinCollapsed(true);
    showTemporarySuccess("五張正逆位判定已完成，最終牌組結果已產生。");
    window.requestAnimationFrame(() => {
      finalResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [lockedCount, showTemporarySuccess]);

  const persistCompletion = useCallback(async (result: DrawResult) => {
    if (!onComplete || completionSaving || completionSent.current) return;
    setCompletionError(null);
    if (!online) {
      setCompletionError("目前網路已中斷，抽牌結果尚未儲存；本機進度會保留，請恢復連線後重新嘗試。");
      return;
    }
    setCompletionSaving(true);
    try {
      await onComplete(result);
      completionSent.current = true;
      clearDraftDraw(draftContextId);
      setSavedAt(new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }));
      showTemporarySuccess("已儲存至雲端。");
    } catch (reason) {
      setCompletionError(reason instanceof Error ? reason.message : "抽牌結果保存失敗，請稍後重試。");
    } finally {
      setCompletionSaving(false);
    }
  }, [completionSaving, draftContextId, onComplete, online, showTemporarySuccess]);

  useEffect(() => {
    if (
      !allCoinsCompleted
      || !sequenceResult
      || !onComplete
      || completionAttempted.current
    ) return;
    const result = buildDrawResult(timeInput, weekday, sequenceResult, cards, questions);
    pendingCompletion.current = result;
    completionAttempted.current = true;
    void persistCompletion(result);
  }, [allCoinsCompleted, cards, onComplete, persistCompletion, questions, sequenceResult, timeInput, weekday]);

  if (completedResult) return <CompletedDrawSummary result={completedResult} questions={questions} />;

  const resetDrawState = () => {
    setSequenceResult(null);
    setValidationIssues([]);
    setCards([]);
    setActiveFlipIndex(null);
    setFlipStarts({});
    setCopyMessage(null);
    setObservationDate(null);
    setCompletionSaving(false);
    setCompletionError(null);
    setSettingsCollapsed(false);
    setSequenceCollapsed(false);
    setCoinCollapsed(false);
    setSuccessMessage(null);
    previousLockedCount.current = 0;
    guideToCoins.current = false;
    completionSent.current = false;
    completionAttempted.current = false;
    pendingCompletion.current = null;
  };

  const confirmRecalculateIfNeeded = (): boolean => {
    if (sequenceResult || cards.length > 0 || activeFlipIndex !== null) {
      return window.confirm("重新計算將清除目前的序號與正逆位操作，是否繼續？");
    }
    return true;
  };

  const handleCalculate = async () => {
    if (activeFlipIndex !== null || completionSaving || operationStatus || !confirmRecalculateIfNeeded()) return;
    const parsedTime = parseTimeInput(timeInput);
    if (!parsedTime) {
      setFormError("請輸入有效時間，格式需為 HH:MM，且小時 00～23、分鐘 00～59。");
      resetDrawState();
      return;
    }
    setOperationStatus("正在計算五序號…");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    const nextSequenceResult = generateSequences(parsedTime.hour, parsedTime.minute);
    const nextValidationIssues = validateSequences(nextSequenceResult);
    setOperationStatus(nextValidationIssues.length > 0 ? null : "正在產生牌卡…");
    if (nextValidationIssues.length === 0) await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    setFormError(null);
    setSequenceResult(nextSequenceResult);
    setValidationIssues(nextValidationIssues);
    setActiveFlipIndex(null);
    setFlipStarts({});
    setCopyMessage(null);
    completionSent.current = false;
    setObservationDate(nextValidationIssues.length > 0 ? null : new Date());
    setCards(nextValidationIssues.length > 0 ? [] : buildDrawCards(nextSequenceResult, weekday));
    setSettingsCollapsed(nextValidationIssues.length === 0);
    setSequenceCollapsed(nextValidationIssues.length === 0);
    setCoinCollapsed(false);
    previousLockedCount.current = 0;
    if (nextValidationIssues.length === 0) {
      guideToCoins.current = true;
      showTemporarySuccess("五個序號計算完成，已前往正逆位抽牌。");
    } else {
      window.requestAnimationFrame(() => sequencePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    setOperationStatus(null);
  };

  const handleWeekdayChange = (value: WeekdayKey) => {
    setWeekday(value);
    setCopyMessage(null);
    if (sequenceResult && validationIssues.length === 0) {
      setCards((currentCards) => buildDrawCards(sequenceResult, value, currentCards));
    }
  };

  const handleStopFlip = (index: number) => {
    setCards((currentCards) => currentCards.map((card, currentIndex) => {
      if (currentIndex !== index || !flipStarts[index]) return card;
      return { ...card, orientationResult: finalizeCoinFlip(flipStarts[index], card.orientationResult as OrientationResult | null) };
    }));
    setActiveFlipIndex(null);
  };

  const handleRestart = () => {
    if (!window.confirm("重新開始將清除目前的抽牌設定、序號與正逆位結果，是否繼續？")) return;
    if (!embedded) {
      setTimeInput("");
      setWeekday(systemWeekday);
    }
    setFormError(null);
    resetDrawState();
    clearDraftDraw(draftContextId);
  };

  const handleRestoreDraft = () => {
    if (recoveryResult.status !== "valid" && recoveryResult.status !== "expired") return;
    const draft = recoveryResult.draft;
    setTimeInput(draft.drawTime);
    setWeekday(draft.weekday);
    setSequenceResult(draft.sequenceResult as SequenceResult | null);
    setValidationIssues(draft.validationIssues);
    setCards(draft.cards);
    setObservationDate(new Date(draft.observationDate));
    setSettingsCollapsed(Boolean(draft.sequenceResult));
    setSequenceCollapsed(Boolean(draft.sequenceResult));
    setCoinCollapsed(false);
    previousLockedCount.current = draft.cards.filter((card) => card.orientationResult?.locked).length;
    pendingCompletion.current = null;
    completionAttempted.current = false;
    completionSent.current = false;
    setRecoveryResult({ status: "none" });
    setRecoveryResolved(true);
    const restoredCount = draft.cards.filter((card) => card.orientationResult?.locked).length;
    showTemporarySuccess(`已恢復上次未完成的抽牌進度。已恢復進度：${restoredCount} / 5`);
    window.requestAnimationFrame(() => {
      if (draft.sequenceResult && draft.cards.length > 0) {
        coinPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => coinButtonRefs.current[restoredCount]?.focus({ preventScroll: true }), 300);
      } else {
        timeInputRef.current?.focus();
      }
    });
  };

  const handleDiscardDraft = () => {
    if (recoveryResult.status !== "invalid" && !window.confirm("這會清除尚未完成的抽牌進度，已完成的正逆位也會被清除。是否確定？")) return;
    clearDraftDraw(draftContextId);
    setRecoveryResult({ status: "none" });
    setRecoveryResolved(true);
    if (!embedded) {
      setTimeInput("");
      setWeekday(systemWeekday);
    }
    resetDrawState();
    showTemporarySuccess("已清除未完成抽牌。");
    window.requestAnimationFrame(() => timeInputRef.current?.focus());
  };

  const handleCopy = async (): Promise<boolean> => {
    if (!allCoinsCompleted || !observationDate) return false;
    try {
      await navigator.clipboard.writeText(buildCopyText(timeInput, weekday, cards, observationDate));
      setCopyMessage(null);
      return true;
    } catch (error) {
      console.error(error);
      setCopyMessage("複製完整結果失敗，瀏覽器可能未允許剪貼簿權限，請確認權限後再試一次。");
      return false;
    }
  };

  return (
    <div className="draw-module">
      {recoveryResult.status !== "none" ? <DrawDraftRecoveryPanel result={recoveryResult} onRestore={recoveryResult.status === "invalid" ? undefined : handleRestoreDraft} onDiscard={handleDiscardDraft} /> : null}
      {embedded ? (
        <section className="panel fixed-draw-settings">
          <div className="section-heading"><p className="eyebrow">抽牌設定</p><h2>使用觀測基本資料</h2></div>
          <div className="draw-context-summary">
            <span>抽牌時間<strong>{timeInput}</strong></span>
            <span>牌卡對照<strong>{getWeekdayLabel(weekday)}</strong></span>
          </div>
          {formError ? <StatusMessage tone="error" message={formError} /> : null}
          <button className="primary-button" type="button" disabled={activeFlipIndex !== null || completionSaving || Boolean(operationStatus)} onClick={() => void handleCalculate()}>計算五個序號</button>
          {activeFlipIndex !== null || completionSaving ? <small className="draw-disabled-reason">抽牌或保存進行中，暫時不能重新計算。</small> : null}
        </section>
      ) : (
        <DrawSettings
          timeInput={timeInput}
          weekday={weekday}
          systemWeekday={systemWeekday}
          error={formError}
          inputRef={timeInputRef}
          collapsed={settingsCollapsed}
          onToggleCollapsed={() => setSettingsCollapsed((value) => !value)}
          disabled={activeFlipIndex !== null || completionSaving || Boolean(operationStatus)}
          disabledReason="抽牌或保存進行中，暫時不能重新計算。"
          onTimeInputChange={(value) => { setTimeInput(formatTimeInput(value)); setFormError(null); setCopyMessage(null); }}
          onWeekdayChange={handleWeekdayChange}
          onSubmit={() => void handleCalculate()}
        />
      )}

      {successMessage ? <StatusMessage tone="success" message={successMessage} /> : null}
      {operationStatus ? <StatusMessage tone="info" message={operationStatus} /> : null}
      {draftError ? <StatusMessage tone="error" message={draftError} onDismiss={() => setDraftError(null)} /> : null}
      <div ref={sequencePanelRef}><SequenceResults sequenceResult={sequenceResult} validationIssues={validationIssues} collapsed={sequenceCollapsed} onToggleCollapsed={() => setSequenceCollapsed((value) => !value)} /></div>

      <section className={`panel draw-panel coin-operation-panel ${allCoinsCompleted ? "is-complete" : ""} ${coinCollapsed ? "is-step-collapsed" : ""}`} ref={coinPanelRef}>
        <div className="section-heading draw-step-heading"><div><p className="eyebrow">步驟 3</p><h2>正逆位抽牌</h2></div>{cards.length > 0 ? <button className="ghost-button compact-button" type="button" onClick={() => setCoinCollapsed((value) => !value)}>{coinCollapsed ? "展開查看" : "收合"}</button> : null}</div>
        {coinCollapsed ? <p className="draw-step-summary">已完成 {lockedCount}／5 張正逆位判定</p> : <>
        <p className="section-description">請依序點擊開始；每張完成後會自動解鎖下一張。</p>
        {validationIssues.length > 0 ? <StatusMessage tone="error" message={validationIssues[0].reason} /> : null}
        {validationIssues.length === 0 && cards.length === 0 ? <p className="placeholder-text">序號有效後，這裡會依序顯示五張待揭示的牌。</p> : null}
        {cards.length > 0 ? (
          <div className="coin-grid">
            {cards.map((card, index) => {
              const previousCardLocked = index === 0 || cards[index - 1].orientationResult?.locked;
              const canInteract = Boolean(previousCardLocked) && !card.orientationResult?.locked;
              return (
                <div className="coin-step" key={card.sequenceKey}>
                  <CoinFlipCard
                    card={card}
                    canInteract={canInteract}
                    isFlipping={activeFlipIndex === index}
                    buttonRef={(element) => { coinButtonRefs.current[index] = element; }}
                    disabledReason={index === 0 ? "等待有效序號" : `請先完成第 ${index} 張`}
                    onStart={() => {
                      setActiveFlipIndex(index);
                      setFlipStarts((current) => ({ ...current, [index]: new Date().toISOString() }));
                      setCopyMessage(null);
                    }}
                    onStop={() => handleStopFlip(index)}
                  />
                </div>
              );
            })}
          </div>
        ) : null}
        {cards.length > 0 && !allCoinsCompleted ? <StatusMessage tone="warning" message={`目前尚未完成五張正逆位判定，無法產生最終結果。（已完成 ${lockedCount}／5 張）`} /> : null}
        {allCoinsCompleted ? (
          <div className="orientation-summary" aria-live="polite">
            <h3>正逆位結果</h3>
            <div className="orientation-summary-list">
              {cards.map((card) => (
                <span
                  className={card.orientationResult?.orientation === "upright" ? "is-upright" : "is-reversed"}
                  key={card.sequenceKey}
                >
                  {card.orientationResult?.orientation === "upright" ? "正位" : "逆位"}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="coin-lock-note">
          <FontAwesomeIcon className="coin-lock-icon" icon={faLock} aria-hidden="true" />
          <span>完成五次抽牌後，將顯示正逆位結果與對應牌。</span>
        </div>
        </>}
      </section>

      {allCoinsCompleted && observationDate ? (
        <div ref={finalResultsRef}><FinalResults
          drawTime={timeInput}
          observationDate={observationDate}
          weekday={weekday}
          cards={cards}
          onCopy={handleCopy}
          onRestart={lockAfterComplete ? undefined : handleRestart}
        /></div>
      ) : null}
      {completionSaving ? <StatusMessage tone="info" message="正在將鎖定結果寫入 Firestore…" /> : null}
      {savedAt ? <StatusMessage tone="success" message={`已儲存至雲端。儲存時間：${savedAt}`} /> : null}
      {completionError ? (
        <section className="panel draw-save-error">
          <StatusMessage tone="error" message={completionError} />
          <button
            className="primary-button"
            type="button"
            disabled={completionSaving || !online}
            onClick={() => {
              if (pendingCompletion.current) void persistCompletion(pendingCompletion.current);
            }}
          >
            {online ? "重新嘗試保存" : "等待網路恢復"}
          </button>
        </section>
      ) : null}
      {copyMessage ? <StatusMessage tone="error" message={copyMessage} /> : null}
      {showDebugPanel && cards.length > 0 ? (
        <section className="panel draw-debug-panel">
          <div className="section-heading">
            <p className="eyebrow">開發除錯</p>
            <h2>硬幣結果檢查</h2>
          </div>
          <p className="section-description">這個區塊只會在本機開發模式顯示，用來確認停止時間與結果記錄。</p>
          <div className="debug-grid">
            {cards.map((card) => {
              const orientationResult = card.orientationResult;
              return (
                <article className="debug-card" key={card.sequenceKey}>
                  <strong>第{card.order}張牌｜序號 {card.formattedSequence}</strong>
                  <span>開始時間：{orientationResult?.startedAt ?? "尚未開始"}</span>
                  <span>停止時間：{orientationResult?.stoppedAt ?? "尚未停止"}</span>
                  <span>耗時：{orientationResult ? `${orientationResult.durationMs} ms` : "未產生"}</span>
                  <span>硬幣：{orientationResult ? (orientationResult.coinSide === "heads" ? "正面" : "反面") : "未產生"}</span>
                  <span>正逆位：{orientationResult ? (orientationResult.orientation === "upright" ? "正位" : "逆位") : "未產生"}</span>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
