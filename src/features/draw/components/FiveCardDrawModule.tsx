import { useEffect, useMemo, useRef, useState } from "react";
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
  onComplete?: (result: DrawResult) => void;
};

export function FiveCardDrawModule({ fixedTime, fixedWeekday, questions = [], completedResult, onComplete }: Props) {
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
  const completionSent = useRef(false);

  useEffect(() => {
    if (fixedTime !== undefined) setTimeInput(fixedTime);
    if (fixedWeekday !== undefined) setWeekday(fixedWeekday);
  }, [fixedTime, fixedWeekday]);

  const allCoinsCompleted = cards.length === 5 && cards.every((card) => card.orientationResult?.locked);

  useEffect(() => {
    if (!allCoinsCompleted || !sequenceResult || !onComplete || completionSent.current) return;
    completionSent.current = true;
    onComplete(buildDrawResult(timeInput, weekday, sequenceResult, cards, questions));
  }, [allCoinsCompleted, cards, onComplete, questions, sequenceResult, timeInput, weekday]);

  if (completedResult) return <CompletedDrawSummary result={completedResult} questions={questions} />;

  const resetDrawState = () => {
    setSequenceResult(null);
    setValidationIssues([]);
    setCards([]);
    setActiveFlipIndex(null);
    setFlipStarts({});
    setCopyMessage(null);
    completionSent.current = false;
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

      <section className="panel">
        <div className="section-heading"><p className="eyebrow">正逆位</p><h2>五次硬幣逐張操作</h2></div>
        {validationIssues.length > 0 ? <StatusMessage tone="warning" message="序號無效時，不載入牌卡結果，也不啟用硬幣操作。" /> : null}
        {validationIssues.length === 0 && cards.length === 0 ? <p className="placeholder-text">序號有效後，這裡會依序顯示五張待揭示的牌。</p> : null}
        {cards.length > 0 ? (
          <div className="coin-grid">
            {cards.map((card, index) => {
              const previousCardLocked = index === 0 || cards[index - 1].orientationResult?.locked;
              const canInteract = Boolean(previousCardLocked) && !card.orientationResult?.locked;
              const question = [...questions].sort((a, b) => a.order - b.order)[index];
              return (
                <div className="draw-question-card" key={card.sequenceKey}>
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
              );
            })}
          </div>
        ) : null}
      </section>

      {allCoinsCompleted ? <FinalResults drawTime={timeInput} weekday={weekday} cards={cards} onCopy={handleCopy} onRestart={handleRestart} /> : null}
      {copyMessage ? <StatusMessage tone="info" message={copyMessage} /> : null}
    </div>
  );
}
