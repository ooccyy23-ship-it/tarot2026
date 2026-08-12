import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { tarotCardNames } from "../data/tarotCardCatalog";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { createTarotRecordFingerprint } from "../features/records/logic/tarotRecordFingerprint";
import { formatDateForDisplay } from "../features/records/parser/observationDateTime";
import {
  finalizeParsedTarotGroup,
  parseTarotRecordDraft,
  updateDraftCardName,
  validateParsedTarotGroup,
} from "../features/records/parser/parseTarotRecord";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import {
  clearTarotImportDraft,
  loadTarotImportDraft,
  saveTarotImportDraft,
} from "../features/records/storage/tarotImportDraftStorage";
import type {
  ParsedTarotGroupDraft,
  ParsedTarotRecordDraft,
  TarotOrientationLabel,
  TarotRecordDuplicate,
  TarotRecordParseIssue,
} from "../features/records/types/tarotRecord";

function uniqueIssues(issues: TarotRecordParseIssue[]): TarotRecordParseIssue[] {
  return issues.filter((issue, index, all) => all.findIndex((candidate) => (
    candidate.code === issue.code && candidate.questionOrder === issue.questionOrder && candidate.message === issue.message
  )) === index);
}

export function TarotRecordImportPage() {
  const restored = useMemo(() => loadTarotImportDraft(), []);
  const [input, setInput] = useState(restored?.input ?? "");
  const [draft, setDraft] = useState<ParsedTarotGroupDraft | null>(restored?.group ?? null);
  const [parseIssues, setParseIssues] = useState<TarotRecordParseIssue[]>([]);
  const [notice, setNotice] = useState(restored?.source === "draw_result" ? "已從剛完成的抽牌自動帶入。" : restored ? "已恢復尚未儲存的匯入草稿。" : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedGroupId, setSavedGroupId] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [duplicate, setDuplicate] = useState<TarotRecordDuplicate | null>(null);
  const online = useOnlineStatus();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const skipNextAutoParse = useRef(Boolean(restored?.group));

  const validationIssues = useMemo(() => {
    if (!draft) return uniqueIssues(parseIssues);
    return uniqueIssues([...parseIssues, ...draft.records.flatMap((record) => record.issues), ...validateParsedTarotGroup(draft)]);
  }, [draft, parseIssues]);
  const errors = validationIssues.filter((issue) => issue.severity !== "warning");
  const warnings = validationIssues.filter((issue) => issue.severity === "warning");
  const successfulRows = draft?.records.filter((record) => !errors.some((issue) => issue.questionOrder === record.questionOrder)).length ?? 0;

  useEffect(() => {
    if (!input.trim() || draft?.importSource === "draw_result" || savedGroupId) return;
    if (skipNextAutoParse.current) { skipNextAutoParse.current = false; return; }
    const timer = window.setTimeout(() => {
      const result = parseTarotRecordDraft(input);
      setDraft(result.group);
      setParseIssues(result.issues.filter((issue) => issue.questionOrder === undefined));
      setDuplicate(null);
      setNotice(result.group ? "已自動解析貼上的紀錄。" : "");
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft?.importSource, input, savedGroupId]);

  useEffect(() => {
    if (savedGroupId || (!input.trim() && !draft)) return;
    saveTarotImportDraft({ source: draft?.importSource ?? "manual_text", input, group: draft });
  }, [draft, input, savedGroupId]);

  const handleParse = () => {
    setError(""); setDuplicate(null);
    const result = parseTarotRecordDraft(input);
    setDraft(result.group);
    setParseIssues(result.issues.filter((issue) => issue.questionOrder === undefined));
    setNotice(result.group ? "解析完成，請確認辨識結果。" : "");
  };

  const clearImport = (confirm = true) => {
    if (confirm && (input.trim() || draft) && !window.confirm("這會清除尚未儲存的匯入內容，是否確定？")) return;
    clearTarotImportDraft();
    setInput(""); setDraft(null); setParseIssues([]); setNotice("已清除未完成匯入。"); setError(""); setDuplicate(null); setSavedGroupId(""); setSavedAt("");
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const updateRecord = (questionOrder: number, updater: (record: ParsedTarotRecordDraft) => ParsedTarotRecordDraft) => {
    setDuplicate(null);
    setDraft((current) => current ? {
      ...current,
      records: current.records.map((record) => record.questionOrder === questionOrder ? updater(record) : record),
    } : current);
  };

  const updateOrientation = (record: ParsedTarotRecordDraft, label: TarotOrientationLabel): ParsedTarotRecordDraft => ({
    ...record,
    orientationLabel: label,
    orientation: label === "正位" ? "upright" : "reversed",
    issues: record.issues.filter((issue) => issue.code !== "missing_orientation"),
  });

  const focusFirstError = () => {
    const first = errors[0];
    if (!first) return;
    const key = first.questionOrder ? `${first.questionOrder}:${first.field ?? (first.code.includes("orientation") ? "orientation" : first.code.includes("card") ? "cardName" : "questionText")}` : "input";
    const element = fieldRefs.current[key] ?? textareaRef.current;
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => element?.focus(), 300);
    setError(first.message);
  };

  const saveDraft = async () => {
    if (!draft || saving) return;
    if (errors.length > 0) { focusFirstError(); return; }
    if (!online) { setError("目前網路已中斷，匯入草稿仍保留；恢復連線後請重新儲存。"); return; }
    setSaving(true); setError(""); setDuplicate(null);
    try {
      const finalized = finalizeParsedTarotGroup({ ...draft, fingerprint: createTarotRecordFingerprint(draft) });
      const match = await getTarotRecordService().findDuplicateGroup(finalized);
      if (match) { setDuplicate(match); return; }
      const saved = await getTarotRecordService().saveGroup(finalized);
      clearTarotImportDraft();
      setSavedGroupId(saved.groupId);
      setSavedAt(new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }));
      setNotice("抽牌紀錄已成功儲存。");
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  return <main className="content-page records-page records-import-page">
    <PageHeader eyebrow="Record Import" title="紀錄匯入" description="完成抽牌可直接帶入；手動貼上內容則會自動解析。" actions={<a className="secondary-button button-link" href="#/records">前往抽牌資料庫</a>} />
    {error ? <p className="status-message error" role="alert">{error}</p> : null}
    {notice ? <p className="status-message success" role="status">{notice}</p> : null}

    {savedGroupId ? <section className="panel records-import-success" aria-live="polite">
      <p className="eyebrow">Save Complete</p><h2>抽牌紀錄已成功儲存</h2><p>已儲存至雲端｜{savedAt}</p>
      <div className="actions-row"><a className="primary-button button-link" href={`#/records/detail?groupId=${encodeURIComponent(savedGroupId)}`}>查看剛新增的紀錄</a><a className="secondary-button button-link" href="#/draw">返回抽牌工具</a><button className="secondary-button" type="button" onClick={() => clearImport(false)}>匯入另一筆紀錄</button><a className="ghost-button button-link" href="#/records">前往抽牌資料庫</a></div>
    </section> : <>
      <section className="panel records-import-panel" aria-labelledby="records-import-title">
        <div className="section-heading"><div><p className="eyebrow">01 · 資料來源</p><h2 id="records-import-title">{draft?.importSource === "draw_result" ? "已帶入完成的五抽結果" : "貼上完整五題紀錄"}</h2><p className="section-description">{draft?.importSource === "draw_result" ? "不需再次複製或解析，請直接確認下方資料。" : "停止輸入約 0.4 秒後自動解析，仍可使用重新解析。"}</p></div></div>
        {draft?.importSource !== "draw_result" ? <><label className="records-input-label" htmlFor="tarot-record-input">抽牌紀錄文字</label><textarea ref={(element) => { textareaRef.current = element; fieldRefs.current.input = element; }} id="tarot-record-input" className="records-import-textarea" value={input} placeholder="請貼上完整的五題抽牌紀錄……" onChange={(event) => { setInput(event.target.value); setNotice(""); setError(""); }} /><div className="actions-row records-import-actions"><button className="secondary-button" type="button" disabled={!input.trim()} onClick={handleParse}>重新解析</button><button className="ghost-button" type="button" disabled={!input && !draft} onClick={() => clearImport()}>放棄匯入</button></div></> : <div className="records-prefill-note"><strong>已從剛完成的抽牌自動帶入</strong><span>抽牌日期：{formatDateForDisplay(draft.observationDate)}</span><span>抽牌時間：{draft.observationTime}</span><button className="ghost-button compact-button" type="button" onClick={() => clearImport()}>放棄匯入</button></div>}
      </section>

      <section className="panel records-preview-panel" aria-labelledby="records-preview-title">
        <div className="section-heading"><div><p className="eyebrow">02 · 解析預覽</p><h2 id="records-preview-title">確認辨識結果</h2></div>{draft ? <span className={`status-chip ${errors.length === 0 ? "verified" : "overdue"}`}>{errors.length === 0 ? "可儲存" : "需要修正"}</span> : null}</div>
        {!draft ? <div className="ui-empty-state ui-empty-state-compact"><span className="ui-empty-mark" aria-hidden="true">T</span><strong>尚無解析結果</strong><p>貼上內容後，系統會自動建立五題預覽。</p>{parseIssues.length > 0 ? <ul className="records-inline-errors">{parseIssues.map((issue) => <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>)}</ul> : null}</div> : <>
          <div className="records-recognition-summary"><strong>解析完成</strong><span>成功辨識：{successfulRows} 題</span><span>警告：{warnings.length}</span><span>錯誤：{errors.length}</span></div>
          <div className="records-preview-summary"><div><span>題組</span><strong>{draft.groupTitle}</strong></div><div><span>日期</span><strong>{formatDateForDisplay(draft.observationDate)}</strong></div><div><span>時間</span><strong>{draft.observationTime}</strong></div><div><span>辨識結果</span><strong>{successfulRows} / 5 題完整</strong></div></div>
          {warnings.length > 0 ? <div className="records-warning-list"><strong>建議確認：</strong><ul>{warnings.map((issue) => <li key={`${issue.code}-${issue.questionOrder ?? "group"}`}>{issue.message}</li>)}</ul></div> : null}
          {errors.length > 0 ? <div className="records-error-list" role="alert"><strong>請先修正：</strong><ul>{errors.map((issue) => <li key={`${issue.code}-${issue.questionOrder ?? "group"}-${issue.message}`}>{issue.message}</li>)}</ul></div> : null}
          <div className="records-preview-table-wrap"><table className="records-preview-table"><thead><tr><th>題序</th><th>題目</th><th>序號</th><th>牌卡</th><th>正逆位</th><th>狀態</th></tr></thead><tbody>{draft.records.map((record) => {
            const rowErrors = errors.filter((issue) => issue.questionOrder === record.questionOrder);
            const rowWarnings = warnings.filter((issue) => issue.questionOrder === record.questionOrder);
            const status = rowErrors.length ? "error" : rowWarnings.length ? "warning" : "valid";
            return <tr key={record.id} className={rowErrors.length ? "has-error" : ""}><td><strong>{record.questionOrder}</strong></td><td><textarea ref={(element) => { fieldRefs.current[`${record.questionOrder}:questionText`] = element; }} aria-label={`第${record.questionOrder}題題目`} value={record.questionText} onChange={(event) => updateRecord(record.questionOrder, (current) => ({ ...current, questionText: event.target.value, issues: current.issues.filter((issue) => issue.code !== "question_needs_confirmation") }))} /></td><td>{record.sequence ?? "—"}</td><td><input ref={(element) => { fieldRefs.current[`${record.questionOrder}:cardName`] = element; }} aria-label={`第${record.questionOrder}題牌卡`} list="tarot-card-name-options" value={record.cardName} onChange={(event) => updateRecord(record.questionOrder, (current) => updateDraftCardName(current, event.target.value))} /></td><td><select ref={(element) => { fieldRefs.current[`${record.questionOrder}:orientation`] = element; }} aria-label={`第${record.questionOrder}題正逆位`} value={record.issues.some((issue) => issue.code === "missing_orientation") ? "" : record.orientationLabel} onChange={(event) => updateRecord(record.questionOrder, (current) => updateOrientation(current, event.target.value as TarotOrientationLabel))}><option value="" disabled>請選擇</option><option value="正位">正位</option><option value="逆位">逆位</option></select></td><td><span className={`records-row-status ${status}`}>{status === "error" ? "錯誤" : status === "warning" ? "待確認" : "有效"}</span></td></tr>;
          })}</tbody></table></div>
          <datalist id="tarot-card-name-options">{tarotCardNames.map((name) => <option key={name} value={name} />)}</datalist>
          {duplicate ? <div className="records-duplicate-warning" role="alert"><strong>發現可能重複的抽牌紀錄</strong><span>原紀錄：{formatDateForDisplay(duplicate.observationDate)} {duplicate.observationTime}</span><span>題組：{duplicate.groupTitle}</span><div className="actions-row"><a className="secondary-button button-link" href={`#/records/detail?groupId=${encodeURIComponent(duplicate.groupId)}`}>查看原紀錄</a><button className="ghost-button" type="button" onClick={() => setDuplicate(null)}>取消</button></div></div> : null}
          <div className="actions-row records-preview-actions"><button className="primary-button" type="button" disabled={errors.length > 0 || saving || !online} onClick={() => void saveDraft()}>{saving ? "正在儲存……" : "確認儲存"}</button><button className="secondary-button" type="button" onClick={focusFirstError}>{errors.length > 0 ? "查看第一個錯誤" : "返回確認"}</button></div>
          {errors.length > 0 ? <small className="draw-disabled-reason">尚有 {errors.length} 個錯誤需要修正</small> : !online ? <small className="draw-disabled-reason">目前網路中斷，恢復後才能儲存</small> : null}
        </>}
      </section>
    </>}
  </main>;
}
