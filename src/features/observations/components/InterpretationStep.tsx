import type { ObservationDraft } from "../types/observationDraft";

export function InterpretationStep({
  draft,
  onChange,
  onBack,
  onContinue,
  message,
}: {
  draft: ObservationDraft;
  onChange: (draft: ObservationDraft) => void;
  onBack: () => void;
  onContinue: () => void;
  message: string;
}) {
  const questions = [...(draft.questionGroupSnapshot?.questions ?? [])].sort((a, b) => a.order - b.order);
  const cardsByQuestion = new Map(draft.drawResult?.cards.map((card) => [card.questionId, card]) ?? []);

  const updateInterpretation = (questionId: string, text: string) => {
    const exists = draft.interpretations.some((item) => item.questionId === questionId);
    const interpretations = exists
      ? draft.interpretations.map((item) => item.questionId === questionId ? { ...item, text } : item)
      : [...draft.interpretations, { questionId, text }];
    onChange({ ...draft, interpretations });
  };

  const updateOverall = (key: keyof ObservationDraft["overallInterpretation"], value: string) => {
    onChange({ ...draft, overallInterpretation: { ...draft.overallInterpretation, [key]: value } });
  };

  return (
    <section className="panel flow-panel">
      <div className="section-heading">
        <p className="eyebrow">步驟 4</p>
        <h2>解讀整理</h2>
        <p className="section-description">本階段只保存文字，不會呼叫 AI；可將外部產生的解讀貼入欄位。</p>
      </div>
      <div className="interpretation-list">
        {questions.map((question, index) => {
          const card = cardsByQuestion.get(question.id);
          const text = draft.interpretations.find((item) => item.questionId === question.id)?.text ?? "";
          return (
            <article className="interpretation-entry" key={question.id}>
              <header>
                <span>問題 {index + 1}</span>
                <div><h3>{question.title}</h3>{question.description ? <p>{question.description}</p> : null}</div>
                <strong>{card ? `${card.cardName}・${card.orientationLabel}` : "尚無牌卡"}</strong>
              </header>
              <label className="field">
                <span>單題解讀</span>
                <textarea className="text-area" rows={5} value={text} onChange={(event) => updateInterpretation(question.id, event.target.value)} placeholder="輸入或貼上這一題的解讀內容" />
              </label>
            </article>
          );
        })}
      </div>
      <section className="overall-interpretation">
        <h3>整體整理</h3>
        <div className="form-grid">
          <label className="field field-wide"><span>整體觀測摘要</span><textarea className="text-area" rows={4} value={draft.overallInterpretation.summary} onChange={(event) => updateOverall("summary", event.target.value)} /></label>
          <label className="field field-wide"><span>主要判斷</span><textarea className="text-area" rows={3} value={draft.overallInterpretation.primaryJudgment} onChange={(event) => updateOverall("primaryJudgment", event.target.value)} /></label>
          <label className="field field-wide"><span>不確定或需保留之處</span><textarea className="text-area" rows={3} value={draft.overallInterpretation.uncertainties} onChange={(event) => updateOverall("uncertainties", event.target.value)} /></label>
        </div>
      </section>
      {message ? <p className="notice-text" role="status">{message}</p> : null}
      <div className="flow-actions">
        <button className="ghost-button" type="button" onClick={onBack}>返回查看抽牌結果</button>
        <button className="primary-button" type="button" onClick={onContinue}>下一步：現實驗證設定</button>
      </div>
    </section>
  );
}
