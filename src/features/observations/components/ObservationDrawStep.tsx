import { FiveCardDrawModule } from "../../draw/components/FiveCardDrawModule";
import { weekdayOrder } from "../../draw/logic/drawFlow";
import type { DrawResult } from "../types/observation";
import type { ObservationDraft } from "../types/observationDraft";

export function ObservationDrawStep({
  draft,
  onBack,
  onComplete,
  onContinue,
}: {
  draft: ObservationDraft;
  onBack: () => void;
  onComplete: (result: DrawResult) => void;
  onContinue: () => void;
}) {
  const questions = draft.questionGroupSnapshot?.questions ?? [];
  return (
    <section className="flow-step-section">
      <div className="flow-step-intro">
        <p className="eyebrow">步驟 3</p>
        <h2>抽牌</h2>
        <p>每張牌依序對應一個問題；五次硬幣全部完成後才會揭示並鎖定結果。</p>
      </div>
      <div className="question-binding-strip" aria-label="問題與牌卡對應">
        {[...questions].sort((a, b) => a.order - b.order).map((question, index) => (
          <span key={question.id}><small>問題 {index + 1} ↔ 第 {index + 1} 張牌</small><strong>{question.title}</strong></span>
        ))}
      </div>
      <FiveCardDrawModule
        fixedTime={draft.drawTime}
        fixedWeekday={weekdayOrder[draft.weekday]}
        questions={questions}
        completedResult={draft.drawResult}
        onComplete={onComplete}
      />
      <div className="flow-actions">
        {!draft.drawResult ? <button className="ghost-button" type="button" onClick={onBack}>返回觀測前紀錄</button> : null}
        <button className="primary-button" type="button" disabled={!draft.drawResult} onClick={onContinue}>
          {draft.drawResult ? "下一步：解讀整理" : "完成五張牌後繼續"}
        </button>
      </div>
    </section>
  );
}
