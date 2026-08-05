import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState } from "react";
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

export function SingleCardDrawModule() {
  const systemWeekday = useMemo(() => getSystemWeekday(), []);
  const [timeInput, setTimeInput] = useState("");
  const [weekday, setWeekday] = useState<WeekdayKey>(systemWeekday);
  const [formError, setFormError] = useState<string | null>(null);
  const [sequenceResult, setSequenceResult] = useState<SingleSequenceResult | null>(null);
  const [card, setCard] = useState<DrawCard | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipStartedAt, setFlipStartedAt] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const isLocked = card?.orientationResult?.locked ?? false;

  const handleCalculate = () => {
    if (isLocked || isFlipping) return;
    const parsedTime = parseTimeInput(timeInput);
    if (!parsedTime) {
      setFormError("請輸入有效時間，格式需為 HH:MM，且小時 00～23、分鐘 00～59。");
      setSequenceResult(null);
      setCard(null);
      return;
    }

    const result = calculateSingleSequence(parsedTime.hour, parsedTime.minute);
    const issue = getSingleSequenceIssue(result);
    setSequenceResult(result);
    setFormError(issue);
    setCard(issue ? null : buildSingleDrawCard(result, weekday));
    setCopyMessage(null);
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
    if (isLocked && !window.confirm("開始新的單抽將清除目前已鎖定的結果，是否繼續？")) return;
    setTimeInput("");
    setWeekday(systemWeekday);
    setFormError(null);
    setSequenceResult(null);
    setCard(null);
    setIsFlipping(false);
    setFlipStartedAt(null);
    setCopyMessage(null);
  };

  const handleCopy = async () => {
    if (!card || !isLocked) return;
    try {
      await navigator.clipboard.writeText(buildSingleCopyText(timeInput, weekday, card));
      setCopyMessage("單抽結果已複製到剪貼簿。");
    } catch (error) {
      console.error(error);
      setCopyMessage("複製失敗，請手動複製畫面內容。");
    }
  };

  return (
    <div className="draw-module single-draw-module">
      <DrawSettings
        timeInput={timeInput}
        weekday={weekday}
        systemWeekday={systemWeekday}
        error={formError}
        disabled={isLocked || isFlipping}
        submitLabel="計算單抽序號"
        onTimeInputChange={(value) => {
          setTimeInput(formatTimeInput(value));
          setFormError(null);
          setSequenceResult(null);
          setCard(null);
          setCopyMessage(null);
        }}
        onWeekdayChange={handleWeekdayChange}
        onSubmit={handleCalculate}
      />

      <section className="panel draw-panel single-sequence-panel">
        <div className="section-heading">
          <p className="eyebrow">步驟 2</p>
          <h2>單抽序號計算結果</h2>
        </div>
        {!sequenceResult ? <p className="placeholder-text">完成設定後，這裡會顯示單抽序號。</p> : null}
        {sequenceResult ? (
          <>
            <article className="sequence-card single-sequence-card">
              <span>單抽序號</span>
              <strong>{sequenceResult.formattedSequence}</strong>
            </article>
            {formError ? (
              <StatusMessage tone="error" message="此時間不適合單抽，未載入正式牌卡。" />
            ) : (
              <StatusMessage tone="success" message="序號有效，已可進行正逆位硬幣操作。" />
            )}
            <details className="details-panel">
              <summary>查看計算過程</summary>
              <div className="details-content"><p>{sequenceResult.explanation}</p></div>
            </details>
          </>
        ) : null}
      </section>

      <section className="panel draw-panel coin-operation-panel single-coin-panel">
        <div className="section-heading">
          <p className="eyebrow">步驟 3</p>
          <h2>決定正逆位</h2>
        </div>
        <p className="section-description">點擊開始後將自動完成抽牌，以硬幣正面決定正位、反面決定逆位。</p>
        {!card ? <p className="placeholder-text">序號有效後，這裡會顯示一張待揭示的牌。</p> : null}
        {card ? (
          <div className="single-coin-wrap">
            <CoinFlipCard
              card={card}
              canInteract={!isLocked}
              isFlipping={isFlipping}
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
      </section>

      {card && isLocked ? (
        <section className="panel draw-panel final-results-panel single-final-panel">
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
            <button className="primary-button" type="button" onClick={handleCopy}>複製單抽結果</button>
            <button className="ghost-button" type="button" onClick={handleRestart}>開始新的單抽</button>
          </div>
        </section>
      ) : null}
      {copyMessage ? <StatusMessage tone="info" message={copyMessage} /> : null}
    </div>
  );
}
