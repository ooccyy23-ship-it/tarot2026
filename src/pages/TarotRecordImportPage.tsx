import { useMemo, useRef, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { tarotCardNames } from "../data/tarotCardCatalog";
import { formatDateForDisplay } from "../features/records/parser/observationDateTime";
import {
  finalizeParsedTarotGroup,
  parseTarotRecordDraft,
  updateDraftCardName,
  validateParsedTarotGroup,
} from "../features/records/parser/parseTarotRecord";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type {
  ParsedTarotGroupDraft,
  ParsedTarotRecordDraft,
  TarotOrientationLabel,
  TarotRecordParseIssue,
} from "../features/records/types/tarotRecord";

export function TarotRecordImportPage() {
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<ParsedTarotGroupDraft | null>(null);
  const [parseIssues, setParseIssues] = useState<TarotRecordParseIssue[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validationIssues = useMemo(() => {
    if (!draft) return parseIssues;
    const rowIssues = draft.records.flatMap((record) => record.issues);
    return [...parseIssues, ...rowIssues, ...validateParsedTarotGroup(draft)]
      .filter((issue, index, all) => all.findIndex((candidate) => candidate.message === issue.message) === index);
  }, [draft, parseIssues]);

  const handleParse = () => {
    setNotice("");
    setError("");
    const result = parseTarotRecordDraft(input);
    setDraft(result.group);
    setParseIssues(result.issues.filter((issue) => issue.questionOrder === undefined));
    if (result.group) setNotice(result.issues.length === 0 ? "解析成功，共 5 筆資料。" : "已建立預覽，請修正標記的資料後再繼續。");
  };

  const clearInput = () => {
    if (input.trim() && !window.confirm("確定要清空目前貼上的抽牌紀錄嗎？")) return;
    setInput(""); setDraft(null); setParseIssues([]); setNotice(""); setError("");
    textareaRef.current?.focus();
  };

  const updateRecord = (questionOrder: number, updater: (record: ParsedTarotRecordDraft) => ParsedTarotRecordDraft) => {
    setDraft((current) => current ? { ...current, records: current.records.map((record) => record.questionOrder === questionOrder ? updater(record) : record) } : current);
  };

  const updateOrientation = (record: ParsedTarotRecordDraft, label: TarotOrientationLabel): ParsedTarotRecordDraft => ({
    ...record,
    orientationLabel: label,
    orientation: label === "正位" ? "upright" : "reversed",
    issues: record.issues.filter((issue) => issue.code !== "missing_orientation"),
  });

  const saveDraft = async () => {
    if (!draft || validationIssues.length > 0 || saving) return;
    setSaving(true); setError("");
    try {
      const saved = await getTarotRecordService().saveGroup(finalizeParsedTarotGroup(draft));
      setNotice(`已儲存 5 筆資料，題組編號：${saved.groupId}`);
      setInput(""); setDraft(null); setParseIssues([]);
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="content-page records-page records-import-page">
      <PageHeader eyebrow="Record Import" title="紀錄匯入" description="貼上完整五題抽牌文字，確認解析結果後再存入資料庫。" actions={<a className="secondary-button button-link" href="#/records">前往抽牌資料庫</a>} />
      {error ? <p className="status-message error" role="alert">{error}</p> : null}
      {notice ? <p className="status-message success" role="status">{notice}</p> : null}

      <section className="panel records-import-panel" aria-labelledby="records-import-title">
        <div className="section-heading"><div><p className="eyebrow">01 · 貼上紀錄</p><h2 id="records-import-title">貼上完整五題紀錄</h2><p className="section-description">系統只在您確認內容後寫入資料庫。</p></div></div>
        <label className="records-input-label" htmlFor="tarot-record-input">抽牌紀錄文字</label>
        <textarea ref={textareaRef} id="tarot-record-input" className="records-import-textarea" value={input} placeholder="請貼上完整的五題抽牌紀錄……" onChange={(event) => setInput(event.target.value)} />
        <div className="actions-row records-import-actions"><button className="primary-button" type="button" disabled={!input.trim()} onClick={handleParse}>解析紀錄</button><button className="secondary-button" type="button" disabled={!input && !draft} onClick={clearInput}>清空內容</button></div>
      </section>

      <section className="panel records-preview-panel" aria-labelledby="records-preview-title">
        <div className="section-heading"><div><p className="eyebrow">02 · 解析預覽</p><h2 id="records-preview-title">確認辨識結果</h2></div>{draft ? <span className={`status-chip ${validationIssues.length === 0 ? "verified" : "overdue"}`}>{validationIssues.length === 0 ? "解析成功" : "需要修正"}</span> : null}</div>
        {!draft ? <div className="ui-empty-state ui-empty-state-compact"><span className="ui-empty-mark" aria-hidden="true">T</span><strong>尚未解析紀錄</strong><p>貼上內容並按下「解析紀錄」後，五筆資料會顯示在這裡。</p>{parseIssues.length > 0 ? <ul className="records-inline-errors">{parseIssues.map((issue) => <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>)}</ul> : null}</div> : <>
          <div className="records-preview-summary"><div><span>題組</span><strong>{draft.groupTitle}</strong></div><div><span>日期</span><strong>{formatDateForDisplay(draft.observationDate)}</strong></div><div><span>時間</span><strong>{draft.observationTime}</strong></div><div><span>資料筆數</span><strong>{draft.records.length} 筆</strong></div></div>
          {validationIssues.length > 0 ? <div className="records-error-list" role="alert"><strong>請修正以下問題：</strong><ul>{validationIssues.map((issue) => <li key={`${issue.code}-${issue.questionOrder ?? "group"}-${issue.message}`}>{issue.message}</li>)}</ul></div> : null}
          <div className="records-preview-table-wrap"><table className="records-preview-table"><thead><tr><th>題序</th><th>題目</th><th>牌卡</th><th>正逆位</th><th>狀態</th></tr></thead><tbody>{draft.records.map((record) => {
            const rowHasError = record.issues.length > 0 || !record.questionText.trim() || !record.normalizedCardName;
            return <tr key={record.id} className={rowHasError ? "has-error" : ""}><td><strong>{record.questionOrder}</strong></td><td><textarea aria-label={`第${record.questionOrder}題題目`} value={record.questionText} onChange={(event) => updateRecord(record.questionOrder, (current) => ({ ...current, questionText: event.target.value }))} /></td><td><input aria-label={`第${record.questionOrder}題牌卡`} list="tarot-card-name-options" value={record.cardName} onChange={(event) => updateRecord(record.questionOrder, (current) => updateDraftCardName(current, event.target.value))} /></td><td><select aria-label={`第${record.questionOrder}題正逆位`} value={record.issues.some((issue) => issue.code === "missing_orientation") ? "" : record.orientationLabel} onChange={(event) => updateRecord(record.questionOrder, (current) => updateOrientation(current, event.target.value as TarotOrientationLabel))}><option value="" disabled>請選擇</option><option value="正位">正位</option><option value="逆位">逆位</option></select></td><td><span className={`records-row-status ${rowHasError ? "error" : "valid"}`}>{rowHasError ? "需修正" : "有效"}</span></td></tr>;
          })}</tbody></table></div>
          <datalist id="tarot-card-name-options">{tarotCardNames.map((name) => <option key={name} value={name} />)}</datalist>
          <div className="actions-row records-preview-actions"><button className="primary-button" type="button" disabled={validationIssues.length > 0 || saving} onClick={() => void saveDraft()}>{saving ? "儲存中…" : "確認儲存 5 筆資料"}</button><button className="secondary-button" type="button" onClick={() => textareaRef.current?.focus()}>返回修改</button><button className="ghost-button" type="button" onClick={() => { setDraft(null); setParseIssues([]); }}>取消解析</button></div>
        </>}
      </section>
    </main>
  );
}
