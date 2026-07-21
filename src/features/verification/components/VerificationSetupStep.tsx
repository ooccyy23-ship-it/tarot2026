import type { ObservationDraft } from "../../observations/types/observationDraft";

const evidenceOptions = ["訊息紀錄", "通話紀錄", "實際見面", "第三方資訊", "工作或行政紀錄", "公開資訊", "個人觀察", "其他"];

export function VerificationSetupStep({
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
  const updateVerification = (changes: Partial<ObservationDraft["verification"]>) => {
    onChange({ ...draft, verification: { ...draft.verification, ...changes } });
  };

  const setRequirement = (requirement: ObservationDraft["verification"]["requirement"]) => {
    updateVerification({ requirement, status: requirement === "not_required" ? "not_applicable" : "pending" });
  };

  const toggleEvidence = (source: string) => {
    const current = draft.verification.evidenceSources ?? [];
    updateVerification({
      evidenceSources: current.includes(source) ? current.filter((item) => item !== source) : [...current, source],
    });
  };

  return (
    <section className="panel flow-panel">
      <div className="section-heading">
        <p className="eyebrow">步驟 5</p>
        <h2>現實驗證設定</h2>
        <p className="section-description">先決定是否有能由後續現實事件判定的內容。</p>
      </div>
      <fieldset className="choice-fieldset">
        <legend>這筆觀測是否包含可由現實事件驗證的內容？</legend>
        <div className="choice-grid">
          {([
            ["required", "需要驗證", "設定命題、期限與判定標準"],
            ["not_required", "不需要驗證", "此筆只保留觀測與解讀"],
            ["uncertain", "目前不確定", "先保存，之後再決定是否驗證"],
          ] as const).map(([value, label, description]) => (
            <label className={`choice-card ${draft.verification.requirement === value ? "is-selected" : ""}`} key={value}>
              <input type="radio" name="verification-requirement" value={value} checked={draft.verification.requirement === value} onChange={() => setRequirement(value)} />
              <span><strong>{label}</strong><small>{description}</small></span>
            </label>
          ))}
        </div>
      </fieldset>

      {draft.verification.requirement === "required" ? (
        <div className="verification-required-fields">
          <div className="form-grid">
            <label className="field field-wide"><span>可驗證命題</span><textarea className="text-area" rows={3} value={draft.verification.prediction ?? ""} onChange={(event) => updateVerification({ prediction: event.target.value })} placeholder="描述未來可明確判定是否發生的命題" /></label>
            <label className="field"><span>驗證期限</span><input className="text-input" type="date" value={draft.verification.dueDate ?? ""} onChange={(event) => updateVerification({ dueDate: event.target.value })} /></label>
            <label className="field"><span>預期可能發生的事件</span><input className="text-input" value={draft.verification.expectedEvent ?? ""} onChange={(event) => updateVerification({ expectedEvent: event.target.value })} /></label>
            <label className="field field-wide"><span>判定標準</span><textarea className="text-area" rows={3} value={draft.verification.criteria ?? ""} onChange={(event) => updateVerification({ criteria: event.target.value })} placeholder="什麼情況算符合、部分符合或不符合？" /></label>
          </div>
          <fieldset className="evidence-fieldset">
            <legend>證據來源</legend>
            <div className="evidence-grid">
              {evidenceOptions.map((source) => (
                <label key={source}><input type="checkbox" checked={(draft.verification.evidenceSources ?? []).includes(source)} onChange={() => toggleEvidence(source)} /><span>{source}</span></label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {message ? <p className="form-error" role="alert">{message}</p> : null}
      <div className="flow-actions">
        <button className="ghost-button" type="button" onClick={onBack}>返回解讀整理</button>
        <button className="primary-button" type="button" onClick={onContinue}>下一步：確認與儲存</button>
      </div>
    </section>
  );
}
