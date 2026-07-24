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

type Props = {
  fixedTime?: string;
  fixedWeekday?: WeekdayKey;
  questions?: ObservationQuestion[];
  completedResult?: DrawResult | null;
  onComplete?: (result: DrawResult) => void | Promise<void>;
  lockAfterComplete?: boolean;
};

export function FiveCardDrawModule({
  fixedTime,
  fixedWeekday,
  questions = [],
  completedResult,
  onComplete,
  lockAfterComplete = false,
}: Props) {
  const embedded = fixedTime !== undefined && fixedWeekday !== undefined;
  const systemWeekday = useMemo(() => getSystemWeekday(), []);
  const [timeInput, setTimeInput] = useState(fixedTime ?? "");
  const [weekday, setWeekday] = useState<WeekdayKey>(fixedWeekday ?? systemWeekday);
  const [formError, setFormError] = useState<string | null>(null);
  const [sequenceResult, setSequenceResult] = useState<SequenceResult | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [cards, setCards] = useState<DrawCard[]>([]);
  const [activeFlipIndex, setActiveFlipIndex] = useState<number | null>(null);
  const [flipStarts, setFlipStarts] = useState<Record<number, string>>({});
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [completionSaving, setCompletionSaving] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const completionSent = useRef(false);
  const completionAttempted = useRef(false);
  const pendingCompletion = useRef<DrawResult | null>(null);

  useEffect(() => {
    if (fixedTime !== undefined) setTimeInput(fixedTime);
    if (fixedWeekday !== undefined) setWeekday(fixedWeekday);
  }, [fixedTime, fixedWeekday]);

  const allCoinsCompleted = cards.length === 5 && cards.every((card) => card.orientationResult?.locked);
  const showDebugPanel = import.meta.env.DEV;

  const persistCompletion = useCallback(async (result: DrawResult) => {
    if (!onComplete || completionSaving || completionSent.current) return;
    setCompletionSaving(true);
    setCompletionError(null);
    try {
      await onComplete(result);
      completionSent.current = true;
    } catch (reason) {
      setCompletionError(reason instanceof Error ? reason.message : "抽牌結果保存失敗，請稍後重試。");
    } finally {
      setCompletionSaving(false);
    }
  }, [completionSaving, onComplete]);

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
    setCompletionSaving(false);
    setCompletionError(null);
    completionSent.current = false;
    completionAttempted.current = false;
    pendingCompletion.current = null;
  };

  const confirmResetIfNeeded = (): boolean => {
    if (cards.some((card) => card.orientationResult?.locked) || activeFlipIndex !== null) {
      return window.confirm("重新開始將清除目前五張牌的正逆位結果，是否繼續？");
    }
    return true;
  };

  const handleCalculate = () => {
    if (!confirmResetIfNeeded()) return;
    const parsedTime = parseTimeInput(timeInput);
    if (!parsedTime) {
      setFormError("請輸入有效時間，格式需為 HH:MM，且小時 00～23、分鐘 00～59。");
      resetDrawState();
      return;
    }

    const nextSequenceResult = generateSequences(parsedTime.hour, parsedTime.minute);
    const nextValidationIssues = validateSequences(nextSequenceResult);
    setFormError(null);
    setSequenceResult(nextSequenceResult);
    setValidationIssues(nextValidationIssues);
    setActiveFlipIndex(null);
    setFlipStarts({});
    setCopyMessage(null);
    completionSent.current = false;
    setCards(nextValidationIssues.length > 0 ? [] : buildDrawCards(nextSequenceResult, weekday));
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
    if (!confirmResetIfNeeded()) return;
    if (!embedded) {
      setTimeInput("");
      setWeekday(systemWeekday);
    }
    setFormError(null);
    resetDrawState();
  };

  const handleCopy = async () => {
    if (!allCoinsCompleted) return;
    try {
      await navigator.clipboard.writeText(buildCopyText(timeInput, weekday, cards));
      setCopyMessage("完整結果已複製到剪貼簿。");
    } catch (error) {
      console.error(error);
      setCopyMessage("複製失敗，請手動複製畫面內容。");
    }
  };

  return (
    <div className="draw-module">
      {embedded ? (
        <section className="panel fixed-draw-settings">
          <div className="section-heading"><p className="eyebrow">抽牌設定</p><h2>使用觀測基本資料</h2></div>
          <div className="draw-context-summary">
            <span>抽牌時間<strong>{timeInput}</strong></span>
            <span>牌卡對照<strong>{getWeekdayLabel(weekday)}</strong></span>
          </div>
          {formError ? <StatusMessage tone="error" message={formError} /> : null}
          <button className="primary-button" type="button" onClick={handleCalculate}>計算五個序號</button>
        </section>
      ) : (
        <DrawSettings
          timeInput={timeInput}
          weekday={weekday}
          systemWeekday={systemWeekday}
          error={formError}
          onTimeInputChange={(value) => { setTimeInput(formatTimeInput(value)); setFormError(null); setCopyMessage(null); }}
          onWeekdayChange={handleWeekdayChange}
          onSubmit={handleCalculate}
        />
      )}

      <SequenceResults sequenceResult={sequenceResult} validationIssues={validationIssues} />

      <section className="panel draw-panel coin-operation-panel">
        <div className="section-heading"><p className="eyebrow">步驟 3</p><h2>正逆位五次硬幣操作</h2></div>
        <p className="section-description">請依序抽出 5 次硬幣，決定每張牌的正逆位。</p>
        {validationIssues.length > 0 ? <StatusMessage tone="warning" message="序號無效時，不載入牌卡結果，也不啟用硬幣操作。" /> : null}
        {validationIssues.length === 0 && cards.length === 0 ? <p className="placeholder-text">序號有效後，這裡會依序顯示五張待揭示的牌。</p> : null}
        {cards.length > 0 ? (
          <div className="coin-grid">
            {cards.map((card, index) => {
              const previousCardLocked = index === 0 || cards[index - 1].orientationResult?.locked;
              const canInteract = Boolean(previousCardLocked) && !card.orientationResult?.locked;
              const question = [...questions].sort((a, b) => a.order - b.order)[index];
              return (
                <div className="coin-step" key={card.sequenceKey}>
                  {index > 0 ? <div className="coin-step-arrow" aria-hidden="true">›</div> : null}
                  <div className="draw-question-card">
                  {question ? <div className="draw-question-label"><span>問題 {index + 1}</span><strong>{question.title}</strong></div> : null}
                  <CoinFlipCard
                    card={card}
                    canInteract={canInteract}
                    isFlipping={activeFlipIndex === index}
                    onStart={() => {
                      setActiveFlipIndex(index);
                      setFlipStarts((current) => ({ ...current, [index]: new Date().toISOString() }));
                      setCopyMessage(null);
                    }}
                    onStop={() => handleStopFlip(index)}
                  />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <div className="coin-lock-note">
          <span className="coin-lock-icon" aria-hidden="true">🔒</span>
          <span>完成五次抽牌後，將顯示正逆位結果與對應牌。</span>
        </div>
      </section>

      {allCoinsCompleted ? (
        <FinalResults
          drawTime={timeInput}
          weekday={weekday}
          cards={cards}
          onCopy={handleCopy}
          onRestart={lockAfterComplete ? undefined : handleRestart}
        />
      ) : null}
      {completionSaving ? <StatusMessage tone="info" message="正在將鎖定結果寫入 Firestore…" /> : null}
      {completionError ? (
        <section className="panel draw-save-error">
          <StatusMessage tone="error" message={completionError} />
          <button
            className="primary-button"
            type="button"
            disabled={completionSaving}
            onClick={() => {
              if (pendingCompletion.current) void persistCompletion(pendingCompletion.current);
            }}
          >
            重新嘗試保存
          </button>
        </section>
      ) : null}
      {copyMessage ? <StatusMessage tone="info" message={copyMessage} /> : null}
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
