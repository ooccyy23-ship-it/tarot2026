import { useEffect, useRef, useState } from "react";
import { createObservationId, formatObservationDate } from "../features/draw/logic/observationMetadata";
import { getWeekdayLabel } from "../logic/weekday";
import type { DrawCard, WeekdayKey } from "../types/tarot";

type FinalResultsProps = {
  drawTime: string;
  observationDate: Date;
  weekday: WeekdayKey;
  cards: DrawCard[];
  onCopy: () => Promise<boolean>;
  onRestart?: () => void;
};

export function FinalResults({
  drawTime,
  observationDate,
  weekday,
  cards,
  onCopy,
  onRestart,
}: FinalResultsProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const observationId = createObservationId(observationDate, drawTime);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  const handleCopy = async () => {
    const succeeded = await onCopy();
    if (!succeeded) return;
    setCopied(true);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="panel draw-panel final-results-panel">
      <div className="section-heading">
        <p className="eyebrow">步驟 4</p>
        <h2>最終牌組結果</h2>
      </div>

      <div className="final-results">
        {cards.map((card) => (
          <article key={card.sequenceKey} className="final-card">
            <div className="final-card-header">
              <h3>第{card.order}張</h3>
              <span className="final-card-chip">
                {card.orientationResult?.orientation === "upright" ? "正位" : "逆位"}
              </span>
            </div>
            <strong className="final-card-name">{card.mapping.cardName}</strong>
            <div className="final-card-meta">
              <span>序號 {card.formattedSequence}</span>
              <span>牌號 {card.mapping.cardNumber}</span>
              <span>硬幣 {card.orientationResult?.coinSide === "heads" ? "正面" : "反面"}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="copy-preview final-copy-preview">
        <p>觀測編號：{observationId}</p>
        <p>觀測日期：{formatObservationDate(observationDate)}</p>
        <p>抽牌時間：{drawTime}</p>
        <p>星期對照：{getWeekdayLabel(weekday)}</p>
      </div>

      <div className="actions-row final-actions-row">
        <button className="primary-button" type="button" onClick={() => void handleCopy()}>
          {copied ? "已複製完整結果" : "複製完整結果"}
        </button>
        {onRestart ? (
          <button className="ghost-button" type="button" onClick={onRestart}>
            重新開始
          </button>
        ) : null}
      </div>
    </section>
  );
}
