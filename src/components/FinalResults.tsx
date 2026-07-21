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
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">步驟 4</p>
        <h2>最終牌組結果</h2>
      </div>

      <div className="final-results">
        {cards.map((card) => (
          <article key={card.sequenceKey} className="final-card">
            <h3>第{card.order}張</h3>
            <p>序號：{card.formattedSequence}</p>
            <p>牌號：{card.mapping.cardNumber}</p>
            <p>牌名：{card.mapping.cardName}</p>
            <p>正逆位：{card.orientationResult?.orientation === "upright" ? "正位" : "逆位"}</p>
            <p>硬幣：{card.orientationResult?.coinSide === "heads" ? "正面" : "反面"}</p>
          </article>
        ))}
      </div>

      <div className="copy-preview">
        <p>抽牌時間：{drawTime}</p>
        <p>對照表：{getWeekdayLabel(weekday)}</p>
      </div>

      <div className="actions-row">
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
