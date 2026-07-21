import type { DrawResult } from "../../observations/types/observation";
import type { ObservationQuestion } from "../../questionGroups/types/questionGroup";
import { getWeekdayLabel } from "../../../logic/weekday";
import { weekdayOrder } from "../logic/drawFlow";

export function CompletedDrawSummary({ result, questions }: { result: DrawResult; questions: ObservationQuestion[] }) {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  return (
    <section className="panel completed-draw-panel">
      <div className="section-heading">
        <p className="eyebrow">抽牌結果已鎖定</p>
        <h2>五張牌已完成</h2>
        <p className="section-description">已完成的序號、牌卡與正逆位不可重新抽取或修改。</p>
      </div>
      <div className="draw-context-summary">
        <span>抽牌時間<strong>{result.drawTime}</strong></span>
        <span>牌卡對照<strong>{getWeekdayLabel(weekdayOrder[result.selectedWeekday])}</strong></span>
        <span>五序號<strong>{result.sequences.map((value) => String(value).padStart(2, "0")).join("・")}</strong></span>
      </div>
      <div className="interpretation-card-grid">
        {result.cards.map((card) => (
          <article className="locked-result-card" key={card.position}>
            <span>第 {card.position} 張｜{questionMap.get(card.questionId)?.title ?? `問題 ${card.position}`}</span>
            <strong>{card.cardName}・{card.orientationLabel}</strong>
            <small>序號 {String(card.sequence).padStart(2, "0")}｜硬幣{card.coinSide === "heads" ? "正面" : "反面"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
