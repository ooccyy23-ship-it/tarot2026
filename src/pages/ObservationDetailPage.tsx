import { useEffect, useMemo, useState } from "react";
import { CompletedDrawSummary } from "../features/draw/components/CompletedDrawSummary";
import { updateObservationText, type EditableObservationText } from "../features/observations/logic/buildObservation";
import { getObservation, saveObservation } from "../features/observations/storage/database";
import type { Observation } from "../features/observations/types/observation";
import { getEffectiveVerificationStatus, verificationStatusLabels } from "../features/verification/logic/verificationStatus";

function editableText(observation: Observation): EditableObservationText {
  return {
    subjectAlias: observation.subjectAlias,
    topic: observation.topic,
    contextNote: observation.contextNote,
    interpretations: structuredClone(observation.interpretations),
    overallInterpretation: structuredClone(observation.overallInterpretation),
  };
}

export function ObservationDetailPage({ observationId, startEditing = false }: { observationId: string; startEditing?: boolean }) {
  const [observation, setObservation] = useState<Observation | null>(null);
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState<EditableObservationText | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getObservation(observationId).then((item) => { if (item) { setObservation(item); setDraft(editableText(item)); } }).catch(() => setMessage("無法讀取觀測紀錄。")) .finally(() => setLoading(false));
  }, [observationId]);

  const questionMap = useMemo(() => new Map(observation?.questionGroupSnapshot.questions.map((question) => [question.id, question]) ?? []), [observation]);
  if (loading) return <main className="content-page"><section className="panel"><p>正在讀取觀測紀錄…</p></section></main>;
  if (!observation || !draft) return <main className="content-page"><section className="panel empty-state"><h1>找不到觀測紀錄</h1><a className="primary-button button-link" href="#/history">返回歷史觀測</a></section></main>;

  const status = getEffectiveVerificationStatus(observation);
  const updateInterpretation = (questionId: string, text: string) => setDraft((current) => current ? { ...current, interpretations: current.interpretations.map((item) => item.questionId === questionId ? { ...item, text } : item) } : current);
  const handleSave = async () => {
    const next = updateObservationText(observation, draft);
    await saveObservation(next);
    setObservation(next);
    setDraft(editableText(next));
    setEditing(false);
    setMessage("文字紀錄已更新；抽牌結果未變更。");
  };

  return (
    <main className="content-page observation-detail">
      <header className="page-title"><div><p className="eyebrow">觀測詳細</p><h1>{observation.topic || observation.questionGroupSnapshot.title}</h1><p>{observation.observationDate} {observation.drawTime}・{observation.subjectAlias || "未填代稱"}</p></div><span className={`status-chip ${status}`}>{verificationStatusLabels[status]}</span></header>
      <div className="detail-toolbar"><a className="ghost-button button-link" href="#/history">返回歷史觀測</a>{editing ? <><button className="ghost-button" type="button" onClick={() => { setDraft(editableText(observation)); setEditing(false); }}>取消修改</button><button className="primary-button" type="button" onClick={() => void handleSave()}>儲存文字紀錄</button></> : <button className="secondary-button" type="button" onClick={() => setEditing(true)}>編輯文字紀錄</button>}</div>
      {message ? <p className="notice-text" role="status">{message}</p> : null}
      <section className="panel detail-section"><h2>基本資料與觀測前紀錄</h2>{editing ? <div className="form-grid"><label className="field"><span>觀測對象代稱</span><input className="text-input" value={draft.subjectAlias ?? ""} onChange={(event) => setDraft({ ...draft, subjectAlias: event.target.value })} /></label><label className="field"><span>觀測主題</span><input className="text-input" value={draft.topic ?? ""} onChange={(event) => setDraft({ ...draft, topic: event.target.value })} /></label><label className="field field-wide"><span>補充背景</span><textarea className="text-area" rows={3} value={draft.contextNote ?? ""} onChange={(event) => setDraft({ ...draft, contextNote: event.target.value })} /></label></div> : <dl className="summary-list"><div><dt>題組</dt><dd>{observation.questionGroupSnapshot.title}</dd></div><div><dt>星期對照</dt><dd>{observation.weekdayLabel}</dd></div><div><dt>主要情緒</dt><dd>{observation.preEmotion.primaryEmotion}</dd></div><div><dt>期待／焦慮／平靜</dt><dd>{observation.preEmotion.expectationLevel}／{observation.preEmotion.anxietyLevel}／{observation.preEmotion.calmLevel}</dd></div><div><dt>補充背景</dt><dd>{observation.contextNote || "未填寫"}</dd></div></dl>}</section>
      <CompletedDrawSummary result={observation.drawResult} questions={observation.questionGroupSnapshot.questions} />
      <section className="panel detail-section"><div className="section-heading"><p className="eyebrow">文字紀錄</p><h2>解讀整理</h2></div><div className="interpretation-list">{[...observation.questionGroupSnapshot.questions].sort((a, b) => a.order - b.order).map((question, index) => { const card = observation.drawResult.cards.find((item) => item.questionId === question.id); const text = draft.interpretations.find((item) => item.questionId === question.id)?.text ?? ""; return <article className="interpretation-entry" key={question.id}><header><span>問題 {index + 1}</span><div><h3>{question.title}</h3></div><strong>{card?.cardName}・{card?.orientationLabel}</strong></header>{editing ? <textarea className="text-area" rows={4} aria-label={`${question.title}解讀`} value={text} onChange={(event) => updateInterpretation(question.id, event.target.value)} /> : <p className="saved-text">{text || "尚未填寫解讀"}</p>}</article>; })}</div><section className="overall-interpretation"><h3>整體整理</h3>{editing ? <div className="form-grid"><label className="field field-wide"><span>整體觀測摘要</span><textarea className="text-area" rows={3} value={draft.overallInterpretation.summary ?? ""} onChange={(event) => setDraft({ ...draft, overallInterpretation: { ...draft.overallInterpretation, summary: event.target.value } })} /></label><label className="field field-wide"><span>主要判斷</span><textarea className="text-area" rows={3} value={draft.overallInterpretation.primaryJudgment ?? ""} onChange={(event) => setDraft({ ...draft, overallInterpretation: { ...draft.overallInterpretation, primaryJudgment: event.target.value } })} /></label><label className="field field-wide"><span>不確定或需保留之處</span><textarea className="text-area" rows={3} value={draft.overallInterpretation.uncertainties ?? ""} onChange={(event) => setDraft({ ...draft, overallInterpretation: { ...draft.overallInterpretation, uncertainties: event.target.value } })} /></label></div> : <dl className="summary-list"><div><dt>整體摘要</dt><dd>{observation.overallInterpretation.summary || "未填寫"}</dd></div><div><dt>主要判斷</dt><dd>{observation.overallInterpretation.primaryJudgment || "未填寫"}</dd></div><div><dt>保留之處</dt><dd>{observation.overallInterpretation.uncertainties || "未填寫"}</dd></div></dl>}</section></section>
      <section className="panel detail-section" id="verification"><div className="section-heading"><p className="eyebrow">現實驗證</p><h2>{verificationStatusLabels[status]}</h2></div><dl className="summary-list"><div><dt>驗證需求</dt><dd>{observation.verification.requirement === "required" ? "需要驗證" : observation.verification.requirement === "not_required" ? "不需要驗證" : "目前不確定"}</dd></div><div><dt>可驗證命題</dt><dd>{observation.verification.prediction || "未設定"}</dd></div><div><dt>期限</dt><dd>{observation.verification.dueDate || "未設定"}</dd></div><div><dt>判定標準</dt><dd>{observation.verification.criteria || "未設定"}</dd></div><div><dt>證據來源</dt><dd>{observation.verification.evidenceSources?.join("、") || "未選擇"}</dd></div>{status === "verified" ? <><div><dt>實際發生事件</dt><dd>{observation.verification.actualEvent || "未填寫"}</dd></div><div><dt>驗證結果</dt><dd>{observation.verification.result === "matched" ? "完全符合" : observation.verification.result === "partially_matched" ? "部分符合" : observation.verification.result === "not_matched" ? "不符合" : "無法判定"}</dd></div><div><dt>驗證日期</dt><dd>{observation.verification.verifiedAt || "未填寫"}</dd></div><div><dt>反思備註</dt><dd>{observation.verification.reflection || "未填寫"}</dd></div></> : null}</dl>{status === "pending" || status === "overdue" ? <a className="secondary-button button-link inline-button" href="#/pending">進入現實驗證</a> : null}</section>
    </main>
  );
}
