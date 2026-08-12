import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CoinFlipCard } from "../../../components/CoinFlipCard";
import { DrawSettings } from "../../../components/DrawSettings";
import { StatusMessage } from "../../../components/StatusMessage";
import { finalizeCoinFlip } from "../../../logic/flipCoin";
import { getSystemWeekday, getWeekdayLabel } from "../../../logic/weekday";
import type { DrawCard, SingleSequenceResult, WeekdayKey } from "../../../types/tarot";
import { formatTimeInput, parseTimeInput } from "../logic/drawFlow";
import {
  buildSingleCopyText,
  buildSingleDrawCard,
  calculateSingleSequence,
  getSingleSequenceIssue,
} from "../logic/singleDraw";
import { DrawDraftRecoveryPanel } from "./DrawDraftRecoveryPanel";
import {
  clearDraftDraw,
  loadDraftDraw,
  saveDraftDraw,
  type DrawDraftLoadResult,
} from "../storage/drawDraftStorage";

type Props = {
  isActive?: boolean;
  onProgressChange?: (inProgress: boolean) => void;
  draftContextId?: string;
  draftQuestionGroupName?: string;
};

export function SingleCardDrawModule({
  isActive = true,
  onProgressChange,
  draftContextId = "draw-tool",
  draftQuestionGroupName = "一般單抽",
}: Props) {
  const systemWeekday = useMemo(() => getSystemWeekday(), []);
  const [timeInput, setTimeInput] = useState("");
  const [weekday, setWeekday] = useState<WeekdayKey>(systemWeekday);
  const [formError, setFormError] = useState<string | null>(null);
  const [sequenceResult, setSequenceResult] = useState<SingleSequenceResult | null>(null);
  const [card, setCard] = useState<DrawCard | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipStartedAt, setFlipStartedAt] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [copyMessageTone, setCopyMessageTone] = useState<"success" | "error">("success");
  const [copying, setCopying] = useState(false);
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [sequenceCollapsed, setSequenceCollapsed] = useState(false);
  const [coinCollapsed, setCoinCollapsed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [operationStatus, setOperationStatus] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [recoveryResult, setRecoveryResult] = useState<DrawDraftLoadResult>({ status: "none" });
  const [recoveryResolved, setRecoveryResolved] = useState(false);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const coinPanelRef = useRef<HTMLElement | null>(null);
  const coinButtonRef = useRef<HTMLButtonElement | null>(null);
  const finalResultRef = useRef<HTMLElement | null>(null);
  const guideToCoin = useRef(false);
  const wasLocked = useRef(false);
  const successTimer = useRef<number | null>(null);

  const isLocked = card?.orientationResult?.locked ?? false;
  const drawInProgress = Boolean(timeInput || sequenceResult || card || isFlipping) && !isLocked;

  useEffect(() => {
    if (!isActive || recoveryResolved) return;
    const result = loadDraftDraw(draftContextId);
    if ((result.status === "valid" || result.status === "expired") && result.draft.mode !== "single") {
      setRecoveryResult({ status: "none" });
      setRecoveryResolved(true);
      return;
    }
    setRecoveryResult(result);
    setRecoveryResolved(result.status === "none");
  }, [draftContextId, isActive, recoveryResolved]);

  useEffect(() => {
    if (!isActive || !recoveryResolved || !parseTimeInput(timeInput) || isLocked) return;
    try {
      saveDraftDraw({
        mode: "single",
        contextId: draftContextId,
        questionGroupName: draftQuestionGroupName,
        observationDate: new Date().toISOString(),
        drawTime: timeInput,
        weekday,
        sequenceResult,
        validationIssues: [],
        cards: card ? [card] : [],
        progress: sequenceResult ? "sequences_ready" : "time_entered",
      });
      setDraftError(null);
    } catch (reason) {
      setDraftError(reason instanceof Error ? `未完成抽牌暫存失敗：${reason.message}` : "未完成抽牌暫存失敗。");
    }
  }, [card, draftContextId, draftQuestionGroupName, isActive, isLocked, recoveryResolved, sequenceResult, timeInput, weekday]);

  useEffect(() => {
    if (isLocked) clearDraftDraw(draftContextId);
  }, [draftContextId, isLocked]);

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
    if (isActive && !sequenceResult) window.requestAnimationFrame(() => timeInputRef.current?.focus());
  }, [isActive, sequenceResult]);

  useEffect(() => {
    if (!isActive || !drawInProgress) return;
    const message = "目前單抽尚未完成，離開後本次未完成操作可能遺失。確定要離開嗎？";
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
    if (!guideToCoin.current || !card || isLocked) return;
    guideToCoin.current = false;
    window.requestAnimationFrame(() => {
      coinPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => coinButtonRef.current?.focus({ preventScroll: true }), 300);
    });
  }, [card, isLocked]);

  useEffect(() => {
    if (!isLocked || wasLocked.current) {
      wasLocked.current = isLocked;
      return;
    }
    wasLocked.current = true;
    setCoinCollapsed(true);
    showTemporarySuccess("單抽正逆位判定已完成，最終結果已產生。");
    window.requestAnimationFrame(() => finalResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [isLocked, showTemporarySuccess]);

  const handleCalculate = async () => {
    if (isLocked || isFlipping || operationStatus || (sequenceResult && !window.confirm("重新計算將清除目前的單抽序號與操作，是否繼續？"))) return;
    const parsedTime = parseTimeInput(timeInput);
    if (!parsedTime) {
      setFormError("請輸入有效時間，格式需為 HH:MM，且小時 00～23、分鐘 00～59。");
      setSequenceResult(null);
      setCard(null);
      return;
    }
    setOperationStatus("正在計算單抽序號…");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    const result = calculateSingleSequence(parsedTime.hour, parsedTime.minute);
    const issue = getSingleSequenceIssue(result);
    setOperationStatus(issue ? null : "正在產生牌卡…");
    if (!issue) await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    setSequenceResult(result);
    setFormError(issue);
    setCard(issue ? null : buildSingleDrawCard(result, weekday));
    setCopyMessage(null);
    setSettingsCollapsed(!issue);
    setSequenceCollapsed(!issue);
    setCoinCollapsed(false);
    wasLocked.current = false;
    if (!issue) {
      guideToCoin.current = true;
      showTemporarySuccess("單抽序號計算完成，已前往正逆位操作。");
    }
    setOperationStatus(null);
  };

  const handleWeekdayChange = (value: WeekdayKey) => {
    if (isLocked) return;
    setWeekday(value);
    setCopyMessage(null);
    if (sequenceResult && !getSingleSequenceIssue(sequenceResult)) {
      setCard(buildSingleDrawCard(sequenceResult, value, card ?? undefined));
    }
  };

  const handleStop = () => {
    if (!card || !flipStartedAt) return;
    setCard({
      ...card,
      orientationResult: finalizeCoinFlip(flipStartedAt, card.orientationResult),
    });
    setIsFlipping(false);
  };

  const handleRestart = () => {
    if (!window.confirm("開始新的單抽將清除目前的設定、序號與已鎖定結果，是否繼續？")) return;
    setTimeInput("");
    setWeekday(systemWeekday);
    setFormError(null);
    setSequenceResult(null);
    setCard(null);
    setIsFlipping(false);
    setFlipStartedAt(null);
    setCopyMessage(null);
    setCopying(false);
    setSettingsCollapsed(false);
    setSequenceCollapsed(false);
    setCoinCollapsed(false);
    setSuccessMessage(null);
    guideToCoin.current = false;
    wasLocked.current = false;
    clearDraftDraw(draftContextId);
  };

  const handleRestoreDraft = () => {
    if (recoveryResult.status !== "valid" && recoveryResult.status !== "expired") return;
    const draft = recoveryResult.draft;
    setTimeInput(draft.drawTime);
    setWeekday(draft.weekday);
    setSequenceResult(draft.sequenceResult as SingleSequenceResult | null);
    setCard(draft.cards[0] ?? null);
    setSettingsCollapsed(Boolean(draft.sequenceResult));
    setSequenceCollapsed(Boolean(draft.sequenceResult));
    setCoinCollapsed(false);
    setRecoveryResult({ status: "none" });
    setRecoveryResolved(true);
    showTemporarySuccess(`已恢復上次未完成的抽牌進度。已恢復進度：${draft.cards.filter((item) => item.orientationResult?.locked).length} / 1`);
    guideToCoin.current = Boolean(draft.cards[0] && !draft.cards[0].orientationResult?.locked);
  };

  const handleDiscardDraft = () => {
    if (recoveryResult.status !== "invalid" && !window.confirm("這會清除尚未完成的抽牌進度，已完成的正逆位也會被清除。是否確定？")) return;
    clearDraftDraw(draftContextId);
    setRecoveryResult({ status: "none" });
    setRecoveryResolved(true);
    showTemporarySuccess("已清除未完成抽牌。");
    window.requestAnimationFrame(() => timeInputRef.current?.focus());
  };

  const handleCopy = async () => {
    if (!card || !isLocked || copying) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(buildSingleCopyText(timeInput, weekday, card));
      setCopyMessageTone("success");
      setCopyMessage("單抽結果已複製到剪貼簿。");
      window.setTimeout(() => setCopyMessage(null), 1500);
    } catch (error) {
      console.error(error);
      setCopyMessageTone("error");
      setCopyMessage("複製失敗，瀏覽器可能未允許剪貼簿權限，請確認權限後再試一次。");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="draw-module single-draw-module">
      {recoveryResult.status !== "none" ? <DrawDraftRecoveryPanel result={recoveryResult} onRestore={recoveryResult.status === "invalid" ? undefined : handleRestoreDraft} onDiscard={handleDiscardDraft} /> : null}
      <DrawSettings
        timeInput={timeInput}
        weekday={weekday}
        systemWeekday={systemWeekday}
        error={formError}
        inputRef={timeInputRef}
        collapsed={settingsCollapsed}
        onToggleCollapsed={() => setSettingsCollapsed((value) => !value)}
        disabled={isLocked || isFlipping || Boolean(operationStatus)}
        disabledReason={isFlipping ? "抽牌進行中，暫時不能重新計算。" : isLocked ? "結果已鎖定，請先開始新的單抽。" : undefined}
        submitLabel="計算單抽序號"
        onTimeInputChange={(value) => {
          setTimeInput(formatTimeInput(value));
          setFormError(null);
          setSequenceResult(null);
          setCard(null);
          setCopyMessage(null);
        }}
        onWeekdayChange={handleWeekdayChange}
        onSubmit={() => void handleCalculate()}
      />

      {successMessage ? <StatusMessage tone="success" message={successMessage} /> : null}
      {operationStatus ? <StatusMessage tone="info" message={operationStatus} /> : null}
      {draftError ? <StatusMessage tone="error" message={draftError} onDismiss={() => setDraftError(null)} /> : null}

      <section className={`panel draw-panel single-sequence-panel ${sequenceCollapsed ? "is-step-collapsed" : ""}`}>
        <div className="section-heading draw-step-heading">
          <div><p className="eyebrow">步驟 2</p><h2>單抽序號計算結果</h2></div>
          {sequenceResult ? <button className="ghost-button compact-button" type="button" onClick={() => setSequenceCollapsed((value) => !value)}>{sequenceCollapsed ? "展開查看" : "收合"}</button> : null}
        </div>
        {sequenceCollapsed && sequenceResult ? <p className="draw-step-summary">已完成：序號 {sequenceResult.formattedSequence}</p> : null}
        {!sequenceCollapsed ? <>{!sequenceResult ? <p className="placeholder-text">完成設定後，這裡會顯示單抽序號。</p> : null}
        {sequenceResult ? (
          <>
            <article className="sequence-card single-sequence-card">
              <span>單抽序號</span>
              <strong>{sequenceResult.formattedSequence}</strong>
            </article>
            {formError ? (
              <StatusMessage tone="error" message={formError} />
            ) : (
              <StatusMessage tone="success" message="序號有效，已可進行正逆位硬幣操作。" />
            )}
            <details className="details-panel">
              <summary>查看計算過程</summary>
              <div className="details-content"><p>{sequenceResult.explanation}</p></div>
            </details>
          </>
        ) : null}
        </> : null}
      </section>

      <section className={`panel draw-panel coin-operation-panel single-coin-panel ${coinCollapsed ? "is-step-collapsed" : ""}`} ref={coinPanelRef}>
        <div className="section-heading draw-step-heading">
          <div><p className="eyebrow">步驟 3</p><h2>決定正逆位</h2></div>
          {card ? <button className="ghost-button compact-button" type="button" onClick={() => setCoinCollapsed((value) => !value)}>{coinCollapsed ? "展開查看" : "收合"}</button> : null}
        </div>
        {coinCollapsed ? <p className="draw-step-summary">正逆位判定已完成</p> : <>
        <p className="section-description">點擊開始後將自動完成抽牌，以硬幣正面決定正位、反面決定逆位。</p>
        {!card ? <p className="placeholder-text">序號有效後，這裡會顯示一張待揭示的牌。</p> : null}
        {card ? (
          <div className="single-coin-wrap">
            <CoinFlipCard
              card={card}
              canInteract={!isLocked}
              isFlipping={isFlipping}
              buttonRef={coinButtonRef}
              disabledReason="請先取得有效單抽序號"
              onStart={() => {
                setFlipStartedAt(new Date().toISOString());
                setIsFlipping(true);
                setCopyMessage(null);
              }}
              onStop={handleStop}
            />
          </div>
        ) : null}
        <div className="coin-lock-note">
          <FontAwesomeIcon className="coin-lock-icon" icon={faLock} aria-hidden="true" />
          <span>抽牌完成後結果立即鎖定；需按「開始新的單抽」才能重新抽牌。</span>
        </div>
        </>}
      </section>

      {card && isLocked ? (
        <section className="panel draw-panel final-results-panel single-final-panel" ref={finalResultRef}>
          <div className="section-heading">
            <p className="eyebrow">步驟 4</p>
            <h2>最終單抽結果</h2>
          </div>
          <article className="final-card single-final-card">
            <div className="final-card-header">
              <h3>單抽牌卡</h3>
              <span className="final-card-chip">
                {card.orientationResult?.orientation === "upright" ? "正位" : "逆位"}
              </span>
            </div>
            <strong className="final-card-name">{card.mapping.cardName}</strong>
            <div className="final-card-meta">
              <span>序號 {card.formattedSequence}</span>
              <span>牌號 {card.mapping.cardNumber}</span>
              <span>硬幣 {card.orientationResult?.coinSide === "heads" ? "正面" : "反面"}</span>
              <span>抽牌時間 {timeInput}</span>
              <span>對照表 {getWeekdayLabel(weekday)}</span>
            </div>
          </article>
          <div className="actions-row final-actions-row">
            <button className="primary-button" type="button" disabled={copying} onClick={handleCopy}>{copying ? "複製中…" : "複製單抽結果"}</button>
            <button className="ghost-button" type="button" onClick={handleRestart}>開始新的單抽</button>
          </div>
        </section>
      ) : null}
      {copyMessage ? <StatusMessage tone={copyMessageTone} message={copyMessage} /> : null}
    </div>
  );
}
