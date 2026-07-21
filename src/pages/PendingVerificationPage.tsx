import { useEffect, useMemo, useState } from "react";
import { listObservations, saveObservation } from "../features/observations/storage/database";
import type { Observation } from "../features/observations/types/observation";
import {
  completeVerification,
  getDaysRemaining,
  listPendingVerifications,
  validateVerificationResult,
  type VerificationResultInput,
} from "../features/verification/logic/pendingVerification";

const evidenceOptions = ["訊息紀錄", "通話紀錄", "實際見面", "第三方資訊", "工作或行政紀錄", "公開資訊", "個人觀察", "其他"];
const resultOptions: Array<{ value: NonNullable<Observation["verification"]["result"]>; label: string }> = [
  { value: "matched", label: "完全符合" },
  { value: "partially_matched", label: "部分符合" },
  { value: "not_matched", label: "不符合" },
  { value: "unclear", label: "無法判定" },
];

function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyResult(observation: Observation): VerificationResultInput {
  return {
    actualEvent: observation.verification.actualEvent ?? "",
    result: observation.verification.result ?? "",
    evidenceSources: [...(observation.verification.evidenceSources ?? [])],
    verifiedAt: observation.verification.verifiedAt ?? todayValue(),
    reflection: observation.verification.reflection ?? "",
  };
}

function dueLabel(days: number | null): string {
  if (days === null) return "尚未設定期限";
  if (days < 0) return `已逾期 ${Math.abs(days)} 天`;
  if (days === 0) return "今天到期";
  if (days <= 7) return `即將到期，剩餘 ${days} 天`;
  return `尚有 ${days} 天`;
}

export function PendingVerificationPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VerificationResultInput | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listObservations().then(setObservations).catch(() => setMessage("無法讀取本機待驗證紀錄。")).finally(() => setLoaded(true));
  }, []);

  const pending = useMemo(() => listPendingVerifications(observations), [observations]);

  const startVerification = (observation: Observation) => {
    setEditingId(observation.id);
    setForm(emptyResult(observation));
    setMessage("");
  };

  const toggleEvidence = (source: string) => {
    if (!form) return;
    const next = form.evidenceSources.includes(source)
      ? form.evidenceSources.filter((item) => item !== source)
      : [...form.evidenceSources, source];
    setForm({ ...form, evidenceSources: next });
  };

  const submitVerification = async (observation: Observation) => {
    if (!form) return;
    const errors = validateVerificationResult(form);
    if (errors.length > 0) {
      setMessage(errors.join(" "));
      return;
    }
    setSaving(true);
    try {
      const updated = completeVerification(observation, form);
      await saveObservation(updated);
      setObservations((items) => items.map((item) => item.id === updated.id ? updated : item));
      setEditingId(null);
      setForm(null);
      setMessage("驗證結果已保存，紀錄狀態已更新為「已驗證」。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "驗證結果儲存失敗。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="content-page">
      <header className="page-title"><div><p className="eyebrow">待驗證</p><h1>待驗證紀錄</h1><p>依期限排列，已逾期與即將到期的紀錄會優先顯示。</p></div><span className="status-chip pending">{loaded ? `${pending.length} 筆` : "讀取中"}</span></header>
      {message ? <p className="status-message info" role="status">{message}</p> : null}
      {loaded && pending.length === 0 ? <section className="panel empty-state"><h2>目前沒有待驗證紀錄</h2><p>需要驗證的觀測會依期限顯示在這裡。</p><a className="primary-button button-link" href="#/new">新增觀測</a></section> : null}
      <section className="pending-list" aria-label="待驗證紀錄列表">
        {pending.map((observation) => {
          const days = getDaysRemaining(observation.verification.dueDate);
          const isOverdue = days !== null && days < 0;
          const isEditing = editingId === observation.id && form;
          return <article className="pending-card" key={observation.id}>
            <div className="pending-card-summary">
              <div><span className="history-date">{observation.observationDate}・{observation.drawTime}</span><h2>{observation.questionGroupSnapshot.title}</h2><p>{observation.verification.prediction || "尚未設定可驗證命題"}</p></div>
              <div className="pending-due"><span className={`status-chip ${isOverdue ? "overdue" : "pending"}`}>{dueLabel(days)}</span><small>驗證期限：{observation.verification.dueDate || "未設定"}</small></div>
            </div>
            {!isEditing ? <div className="history-actions"><a className="ghost-button button-link" href={`#/observations/${observation.id}`}>查看觀測</a><button className="primary-button" type="button" onClick={() => startVerification(observation)}>填寫驗證結果</button></div> : (
              <section className="verification-result-form" aria-label="填寫驗證結果">
                <div className="form-grid">
                  <label className="field field-wide"><span>實際發生事件</span><textarea className="text-area" rows={4} value={form.actualEvent} onChange={(event) => setForm({ ...form, actualEvent: event.target.value })} /></label>
                  <label className="field"><span>驗證結果</span><select className="select-input" value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value as VerificationResultInput["result"] })}><option value="">請選擇</option>{resultOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
                  <label className="field"><span>驗證日期</span><input className="text-input" type="date" value={form.verifiedAt} onChange={(event) => setForm({ ...form, verifiedAt: event.target.value })} /></label>
                  <fieldset className="evidence-fieldset field-wide"><legend>證據來源</legend><div className="evidence-grid">{evidenceOptions.map((source) => <label key={source}><input type="checkbox" checked={form.evidenceSources.includes(source)} onChange={() => toggleEvidence(source)} /><span>{source}</span></label>)}</div></fieldset>
                  <label className="field field-wide"><span>反思備註</span><textarea className="text-area" rows={3} value={form.reflection} onChange={(event) => setForm({ ...form, reflection: event.target.value })} /></label>
                </div>
                <div className="flow-actions"><button className="ghost-button" type="button" onClick={() => { setEditingId(null); setForm(null); setMessage(""); }}>取消</button><button className="primary-button" type="button" disabled={saving} onClick={() => void submitVerification(observation)}>{saving ? "儲存中…" : "確認保存驗證結果"}</button></div>
              </section>
            )}
          </article>;
        })}
      </section>
    </main>
  );
}
