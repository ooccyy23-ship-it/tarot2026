import { getWeekdayLabel } from "../../../logic/weekday";
import { weekdayOrder } from "../../draw/logic/drawFlow";
import { verificationStatusLabels } from "../../verification/logic/verificationStatus";
import type { ObservationDraft } from "../types/observationDraft";

const requirementLabels = { required: "需要驗證", not_required: "不需要驗證", uncertain: "目前不確定" } as const;

export function ConfirmationStep({
  draft,
  onBack,
  onSave,
  saving,
  message,
}: {
  draft: ObservationDraft;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  message: string;
}) {
  const questions = [...(draft.questionGroupSnapshot?.questions ?? [])].sort((a, b) => a.order - b.order);
  const cards = draft.drawResult?.cards ?? [];
  const textByQuestion = new Map(draft.interpretations.map((item) => [item.questionId, item.text]));
  const status = draft.verification.requirement === "not_required" ? "not_applicable" : "pending";

  return (
    <section className="panel flow-panel confirmation-step">
      <div className="section-heading"><p className="eyebrow">步驟 6</p><h2>確認與儲存</h2><p className="section-description">確認後將建立正式觀測紀錄；抽牌結果會永久保持唯讀。</p></div>
      <div className="confirmation-sections">
        <section><h3>基本資料</h3><dl className="summary-list"><div><dt>日期與時間</dt><dd>{draft.observationDate} {draft.drawTime}</dd></div><div><dt>星期對照表</dt><dd>{getWeekdayLabel(weekdayOrder[draft.weekday])}</dd></div><div><dt>觀測對象代稱</dt><dd>{draft.subjectAlias || "未填寫"}</dd></div><div><dt>觀測主題</dt><dd>{draft.topic || "未填寫"}</dd></div><div><dt>補充背景</dt><dd>{draft.contextNote || "未填寫"}</dd></div></dl></section>
        <section><h3>題組與抽牌前紀錄</h3><p><strong>{draft.questionGroupSnapshot?.title}</strong></p><dl className="summary-list"><div><dt>主要情緒</dt><dd>{draft.preEmotion.primaryEmotion === "其他" ? draft.preEmotion.customEmotion || "其他" : draft.preEmotion.primaryEmotion}</dd></div><div><dt>期待／焦慮／平靜</dt><dd>{draft.preEmotion.expectationLevel}／{draft.preEmotion.anxietyLevel}／{draft.preEmotion.calmLevel}</dd></div><div><dt>期待結果</dt><dd>{draft.preEmotion.expectedResult || "未填寫"}</dd></div><div><dt>擔心結果</dt><dd>{draft.preEmotion.fearedResult || "未填寫"}</dd></div></dl></section>
        <section className="confirmation-wide"><h3>五序號與五張牌</h3><p className="sequence-summary">{draft.drawResult?.sequences.map((value) => String(value).padStart(2, "0")).join("・")}</p><div className="confirmation-card-grid">{questions.map((question, index) => { const card = cards[index]; return <article key={question.id}><span>問題 {index + 1}</span><h4>{question.title}</h4><strong>{card ? `${card.cardName}・${card.orientationLabel}` : "缺少牌卡"}</strong><p>{textByQuestion.get(question.id) || "尚未填寫單題解讀"}</p></article>; })}</div></section>
        <section><h3>整體解讀</h3><dl className="summary-list"><div><dt>整體摘要</dt><dd>{draft.overallInterpretation.summary || "未填寫"}</dd></div><div><dt>主要判斷</dt><dd>{draft.overallInterpretation.primaryJudgment || "未填寫"}</dd></div><div><dt>保留之處</dt><dd>{draft.overallInterpretation.uncertainties || "未填寫"}</dd></div></dl></section>
        <section><h3>驗證設定</h3><dl className="summary-list"><div><dt>驗證需求</dt><dd>{requirementLabels[draft.verification.requirement]}</dd></div><div><dt>建立後狀態</dt><dd>{verificationStatusLabels[status]}</dd></div>{draft.verification.requirement === "required" ? <><div><dt>可驗證命題</dt><dd>{draft.verification.prediction}</dd></div><div><dt>驗證期限</dt><dd>{draft.verification.dueDate}</dd></div><div><dt>判定標準</dt><dd>{draft.verification.criteria}</dd></div><div><dt>證據來源</dt><dd>{draft.verification.evidenceSources?.join("、") || "未選擇"}</dd></div></> : null}</dl></section>
      </div>
      {message ? <p className="form-error" role="alert">{message}</p> : null}
      <div className="flow-actions"><button className="ghost-button" type="button" disabled={saving} onClick={onBack}>返回修改</button><button className="primary-button" type="button" disabled={saving} onClick={onSave}>{saving ? "儲存中…" : "確認儲存"}</button></div>
    </section>
  );
}
