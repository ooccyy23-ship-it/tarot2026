import { useEffect, useMemo, useRef, useState } from "react";
import { tarotCardNames } from "../data/tarotCardCatalog";
import {
  DEFAULT_TAROT_RECORD_FILTERS,
  filterTarotRecords,
  paginateTarotRecords,
  sortTarotRecordsNewest,
} from "../features/records/logic/tarotRecordCollection";
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
  ParsedTarotRecord,
  ParsedTarotRecordDraft,
  TarotOrientation,
  TarotOrientationLabel,
  TarotRecordEditableFields,
  TarotRecordFilters,
  TarotRecordParseIssue,
} from "../features/records/types/tarotRecord";

const arcanaLabels = { major: "大阿爾克那", minor: "小阿爾克那" } as const;
const suitLabels = {
  major: "大阿爾克那",
  cups: "聖杯",
  swords: "寶劍",
  wands: "權杖",
  pentacles: "星幣",
} as const;

export function TarotRecordsPage() {
  const [showImporter, setShowImporter] = useState(false);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<ParsedTarotGroupDraft | null>(null);
  const [parseIssues, setParseIssues] = useState<TarotRecordParseIssue[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyRecordId, setBusyRecordId] = useState("");
  const [filters, setFilters] = useState<TarotRecordFilters>(DEFAULT_TAROT_RECORD_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editingId, setEditingId] = useState("");
  const [editFields, setEditFields] = useState<TarotRecordEditableFields | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadRecords = async () => {
    setLoadingRecords(true);
    setError("");
    try {
      setRecords(await getTarotRecordService().listRecords());
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => { void loadRecords(); }, []);

  const validationIssues = useMemo(() => {
    if (!draft) return parseIssues;
    const rowIssues = draft.records.flatMap((record) => record.issues);
    return [...parseIssues, ...rowIssues, ...validateParsedTarotGroup(draft)]
      .filter((issue, index, all) => all.findIndex((candidate) => candidate.message === issue.message) === index);
  }, [draft, parseIssues]);

  const groupOptions = useMemo(() => [...new Map(records.map((record) => [record.groupId, record.groupTitle])).entries()], [records]);
  const filteredRecords = useMemo(() => sortTarotRecordsNewest(filterTarotRecords(records, filters)), [filters, records]);
  const paginated = useMemo(() => paginateTarotRecords(filteredRecords, page, pageSize), [filteredRecords, page, pageSize]);
  const advancedFilterCount = useMemo(() => Object.entries(filters)
    .filter(([key, value]) => key !== "keyword" && Boolean(value)).length, [filters]);

  const updateFilter = <K extends keyof TarotRecordFilters>(key: K, value: TarotRecordFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const handleParse = () => {
    setNotice("");
    setError("");
    const result = parseTarotRecordDraft(input);
    setDraft(result.group);
    setParseIssues(result.issues.filter((issue) => issue.questionOrder === undefined));
    if (!result.group) return;
    setNotice(result.issues.length === 0 ? "解析成功，共5筆資料。" : "已建立預覽，請修正標記的資料後再繼續。");
  };

  const clearInput = () => {
    if (input.trim() && !window.confirm("確定要清空目前貼上的抽牌紀錄嗎？")) return;
    setInput("");
    setDraft(null);
    setParseIssues([]);
    setNotice("");
    textareaRef.current?.focus();
  };

  const updateRecord = (questionOrder: number, updater: (record: ParsedTarotRecordDraft) => ParsedTarotRecordDraft) => {
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

  const saveDraft = async () => {
    if (!draft || validationIssues.length > 0 || saving) return;
    setSaving(true);
    setError("");
    try {
      const saved = await getTarotRecordService().saveGroup(finalizeParsedTarotGroup(draft));
      setNotice(`已儲存5筆資料，題組編號：${saved.groupId}`);
      setInput("");
      setDraft(null);
      setParseIssues([]);
      setShowImporter(false);
      await loadRecords();
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record: ParsedTarotRecord) => {
    setEditingId(record.id);
    setEditFields({ questionText: record.questionText, cardName: record.cardName, orientation: record.orientation });
    setError("");
  };

  const saveEdit = async () => {
    if (!editingId || !editFields || busyRecordId) return;
    setBusyRecordId(editingId);
    setError("");
    try {
      const updated = await getTarotRecordService().updateRecord(editingId, editFields);
      setRecords((current) => current.map((record) => record.id === editingId ? updated : record));
      setEditingId("");
      setEditFields(null);
      setNotice("抽牌紀錄已更新。");
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setBusyRecordId("");
    }
  };

  const deleteSingleRecord = async (record: ParsedTarotRecord) => {
    if (!window.confirm(`確定要刪除第${record.questionOrder}題「${record.cardName}${record.orientationLabel}」嗎？刪除後該題組可能少於5筆。`)) return;
    if (!window.confirm("請再次確認：這筆刪除無法復原，仍要繼續嗎？")) return;
    setBusyRecordId(record.id);
    setError("");
    try {
      await getTarotRecordService().deleteRecord(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setNotice("已刪除1筆抽牌紀錄。");
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setBusyRecordId("");
    }
  };

  const deleteGroup = async (record: ParsedTarotRecord) => {
    if (!window.confirm(`確定要刪除題組「${record.groupTitle}」的全部紀錄嗎？`)) return;
    if (!window.confirm(`請再次確認：題組 ${record.groupId} 將整組刪除且無法復原。`)) return;
    setBusyRecordId(record.groupId);
    setError("");
    try {
      const deleted = await getTarotRecordService().deleteGroup(record.groupId);
      setRecords((current) => current.filter((item) => item.groupId !== record.groupId));
      setNotice(`已刪除題組，共${deleted}筆資料。`);
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setBusyRecordId("");
    }
  };

  return (
    <main className="content-page records-page">
      <header className="page-title records-page-title">
        <div><p className="eyebrow">Tarot Records</p><h1>抽牌紀錄</h1><p>搜尋、查看與維護已儲存的五題抽牌資料。</p></div>
        <div className="records-page-actions">
          <button className="primary-button" type="button" aria-expanded={showImporter} onClick={() => setShowImporter((current) => !current)}>{showImporter ? "收起匯入" : "匯入新紀錄"}</button>
          <a className="secondary-button button-link" href="#/analytics">分析儀表板</a>
        </div>
      </header>

      {error ? <p className="status-message error" role="alert">{error}</p> : null}
      {notice ? <p className="status-message success" role="status">{notice}</p> : null}

      {showImporter ? <section className="panel records-import-panel" aria-labelledby="records-import-title">
        <div className="section-heading"><div><p className="eyebrow">匯入</p><h2 id="records-import-title">貼上完整五題紀錄</h2><p className="section-description">解析成功並確認內容後，才會寫入抽牌紀錄。</p></div></div>
        <label className="records-input-label" htmlFor="tarot-record-input">抽牌紀錄文字</label>
        <textarea ref={textareaRef} id="tarot-record-input" className="records-import-textarea" value={input} placeholder="請貼上五題抽牌紀錄……" onChange={(event) => setInput(event.target.value)} />
        <div className="actions-row records-import-actions">
          <button className="primary-button" type="button" disabled={!input.trim()} onClick={handleParse}>解析紀錄</button>
          <button className="ghost-button" type="button" disabled={!input && !draft} onClick={clearInput}>清空內容</button>
        </div>
      </section> : null}

      {showImporter && (draft || parseIssues.length > 0) ? <section className="panel records-preview-panel" aria-labelledby="records-preview-title">
        <div className="section-heading">
          <div><p className="eyebrow">解析預覽</p><h2 id="records-preview-title">確認辨識結果</h2></div>
          {draft ? <span className={`status-chip ${validationIssues.length === 0 ? "verified" : "overdue"}`}>{validationIssues.length === 0 ? "解析成功" : "需要修正"}</span> : null}
        </div>
        {!draft ? (
          <>
            {parseIssues.length > 0 ? <div className="records-error-list" role="alert"><strong>無法建立預覽：</strong><ul>{parseIssues.map((issue) => <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>)}</ul></div> : null}
            <div className="records-placeholder"><strong>尚未解析紀錄</strong><p>貼上內容並按下「解析紀錄」後，五筆資料會顯示在這裡。</p></div>
          </>
        ) : (
          <>
            <div className="records-preview-summary">
              <div><span>題組</span><strong>{draft.groupTitle}</strong></div><div><span>日期</span><strong>{formatDateForDisplay(draft.observationDate)}</strong></div><div><span>時間</span><strong>{draft.observationTime}</strong></div><div><span>資料筆數</span><strong>{draft.records.length} 筆</strong></div>
            </div>
            {validationIssues.length > 0 ? <div className="records-error-list" role="alert"><strong>請修正以下問題：</strong><ul>{validationIssues.map((issue) => <li key={`${issue.code}-${issue.questionOrder ?? "group"}-${issue.message}`}>{issue.message}</li>)}</ul></div> : null}
            <div className="records-preview-table-wrap"><table className="records-preview-table"><thead><tr><th>題序</th><th>題目</th><th>牌卡</th><th>正逆位</th><th>牌類</th><th>牌組</th><th>狀態</th></tr></thead><tbody>
              {draft.records.map((record) => {
                const rowHasError = record.issues.length > 0 || !record.questionText.trim() || !record.normalizedCardName;
                return <tr key={record.id} className={rowHasError ? "has-error" : ""}>
                  <td><strong>{record.questionOrder}</strong></td>
                  <td><textarea aria-label={`第${record.questionOrder}題題目`} value={record.questionText} onChange={(event) => updateRecord(record.questionOrder, (current) => ({ ...current, questionText: event.target.value }))} /></td>
                  <td><input aria-label={`第${record.questionOrder}題牌卡`} list="tarot-card-name-options" value={record.cardName} onChange={(event) => updateRecord(record.questionOrder, (current) => updateDraftCardName(current, event.target.value))} /></td>
                  <td><select aria-label={`第${record.questionOrder}題正逆位`} value={record.issues.some((issue) => issue.code === "missing_orientation") ? "" : record.orientationLabel} onChange={(event) => updateRecord(record.questionOrder, (current) => updateOrientation(current, event.target.value as TarotOrientationLabel))}><option value="" disabled>請選擇</option><option value="正位">正位</option><option value="逆位">逆位</option></select></td>
                  <td>{record.arcanaType ? arcanaLabels[record.arcanaType] : "—"}</td><td>{record.suit ? suitLabels[record.suit] : "—"}</td><td><span className={`records-row-status ${rowHasError ? "error" : "valid"}`}>{rowHasError ? "需修正" : "有效"}</span></td>
                </tr>;
              })}
            </tbody></table></div>
            <datalist id="tarot-card-name-options">{tarotCardNames.map((name) => <option key={name} value={name} />)}</datalist>
            <div className="actions-row records-preview-actions">
              <button className="primary-button" type="button" disabled={validationIssues.length > 0 || saving} onClick={() => void saveDraft()}>{saving ? "儲存中…" : "確認儲存5筆資料"}</button>
              <button className="secondary-button" type="button" onClick={() => textareaRef.current?.focus()}>返回修改</button>
              <button className="ghost-button" type="button" onClick={() => { setDraft(null); setParseIssues([]); }}>取消解析</button>
            </div>
          </>
        )}
      </section> : null}

      <section className="panel records-table-panel" aria-labelledby="records-table-title">
        <div className="section-heading"><div><p className="eyebrow">Records</p><h2 id="records-table-title">已儲存抽牌資料</h2></div><span className="status-chip pending">{filteredRecords.length} 筆</span></div>
        <div className="records-filter-toolbar">
          <label className="records-primary-search"><span>搜尋紀錄</span><input type="search" value={filters.keyword} placeholder="輸入題組、題目或牌名" onChange={(event) => updateFilter("keyword", event.target.value)} /></label>
          <details className="records-advanced-filters" open={advancedFilterCount > 0 || undefined}>
            <summary>進階篩選{advancedFilterCount > 0 ? `（已套用 ${advancedFilterCount} 項）` : ""}</summary>
            <div className="records-filter-grid">
              <label><span>開始日期</span><input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} /></label>
              <label><span>結束日期</span><input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} /></label>
              <label><span>題組</span><select value={filters.groupId} onChange={(event) => updateFilter("groupId", event.target.value)}><option value="">全部題組</option>{groupOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
              <label><span>牌卡</span><select value={filters.cardName} onChange={(event) => updateFilter("cardName", event.target.value)}><option value="">全部牌卡</option>{tarotCardNames.map((name) => <option key={name}>{name}</option>)}</select></label>
              <label><span>正逆位</span><select value={filters.orientation} onChange={(event) => updateFilter("orientation", event.target.value as TarotOrientation | "")}><option value="">全部</option><option value="upright">正位</option><option value="reversed">逆位</option></select></label>
              <label><span>牌類</span><select value={filters.arcanaType} onChange={(event) => updateFilter("arcanaType", event.target.value as TarotRecordFilters["arcanaType"])}><option value="">全部</option><option value="major">大阿爾克那</option><option value="minor">小阿爾克那</option></select></label>
              <label><span>牌組</span><select value={filters.suit} onChange={(event) => updateFilter("suit", event.target.value as TarotRecordFilters["suit"])}><option value="">全部</option><option value="major">大阿爾克那</option><option value="cups">聖杯</option><option value="swords">寶劍</option><option value="wands">權杖</option><option value="pentacles">星幣</option></select></label>
              <button className="ghost-button" type="button" onClick={() => { setFilters(DEFAULT_TAROT_RECORD_FILTERS); setPage(1); }}>清除全部篩選</button>
            </div>
          </details>
        </div>

        {loadingRecords ? <div className="records-placeholder"><strong>載入抽牌紀錄中…</strong></div> : paginated.total === 0 ? <div className="records-placeholder"><strong>沒有符合條件的紀錄</strong><p>可調整篩選條件，或先匯入第一組五題紀錄。</p></div> : (
          <div className="records-data-table-wrap"><table className="records-data-table"><thead><tr><th>日期</th><th>時間</th><th>題組</th><th>題序</th><th>題目</th><th>牌卡</th><th>正逆位</th><th>牌類</th><th>牌組</th><th>操作</th></tr></thead><tbody>
            {paginated.records.map((record) => {
              const editing = editingId === record.id && editFields;
              return <tr key={record.id}>
                <td>{formatDateForDisplay(record.observationDate)}</td><td>{record.observationTime}</td><td><strong>{record.groupTitle}</strong><small>{record.groupId}</small></td><td>{record.questionOrder}</td>
                <td>{editing ? <textarea value={editFields.questionText} onChange={(event) => setEditFields({ ...editFields, questionText: event.target.value })} /> : record.questionText}</td>
                <td>{editing ? <select value={editFields.cardName} onChange={(event) => setEditFields({ ...editFields, cardName: event.target.value })}>{tarotCardNames.map((name) => <option key={name}>{name}</option>)}</select> : record.cardName}</td>
                <td>{editing ? <select value={editFields.orientation} onChange={(event) => setEditFields({ ...editFields, orientation: event.target.value as TarotOrientation })}><option value="upright">正位</option><option value="reversed">逆位</option></select> : record.orientationLabel}</td>
                <td>{arcanaLabels[record.arcanaType]}</td><td>{suitLabels[record.suit]}</td>
                <td><div className="records-row-actions">{editing ? <><button className="compact-button primary-button" type="button" disabled={busyRecordId === record.id} onClick={() => void saveEdit()}>儲存</button><button className="compact-button ghost-button" type="button" onClick={() => { setEditingId(""); setEditFields(null); }}>取消</button></> : <><button className="compact-button secondary-button" type="button" onClick={() => startEdit(record)}>編輯</button><button className="compact-button ghost-button" type="button" disabled={Boolean(busyRecordId)} onClick={() => void deleteSingleRecord(record)}>刪除</button><button className="compact-button danger-button" type="button" disabled={Boolean(busyRecordId)} onClick={() => void deleteGroup(record)}>刪除整組</button></>}</div></td>
              </tr>;
            })}
          </tbody></table></div>
        )}
        <div className="records-pagination">
          <label>每頁 <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select> 筆</label>
          <span>第 {paginated.page} / {paginated.totalPages} 頁</span>
          <div><button className="ghost-button compact-button" type="button" disabled={paginated.page <= 1} onClick={() => setPage((current) => current - 1)}>上一頁</button><button className="ghost-button compact-button" type="button" disabled={paginated.page >= paginated.totalPages} onClick={() => setPage((current) => current + 1)}>下一頁</button></div>
        </div>
      </section>

    </main>
  );
}
