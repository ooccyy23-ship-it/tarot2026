import { getWeekdayLabel } from "../logic/weekday";
import type { DrawCard, WeekdayKey } from "../types/tarot";

type FinalResultsProps = {
  drawTime: string;
  weekday: WeekdayKey;
  cards: DrawCard[];
  onCopy: () => void;
  onRestart: () => void;
};

export function FinalResults({
  drawTime,
  weekday,
  cards,
  onCopy,
  onRestart,
}: FinalResultsProps) {
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
        <p>抽牌時間：{drawTime}</p>
        <p>對照表：{getWeekdayLabel(weekday)}</p>
      </div>

      <div className="actions-row final-actions-row">
        <button className="primary-button" type="button" onClick={onCopy}>
          複製完整結果
        </button>
        <button className="ghost-button" type="button" onClick={onRestart}>
          重新開始
        </button>
      </div>
    </section>
  );
}
