import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { tarotCardNames } from "../data/tarotCardCatalog";
import {
  DEFAULT_TAROT_RECORD_FILTERS,
  filterTarotRecords,
  paginateTarotRecords,
  sortTarotRecordsNewest,
} from "../features/records/logic/tarotRecordCollection";
import { formatDateForDisplay } from "../features/records/parser/observationDateTime";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type {
  ParsedTarotRecord,
  TarotOrientation,
  TarotRecordEditableFields,
  TarotRecordFilters,
} from "../features/records/types/tarotRecord";

export function TarotRecordsPage() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [busyRecordId, setBusyRecordId] = useState("");
  const [filters, setFilters] = useState<TarotRecordFilters>(DEFAULT_TAROT_RECORD_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editingId, setEditingId] = useState("");
  const [editFields, setEditFields] = useState<TarotRecordEditableFields | null>(null);

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

  const groupOptions = useMemo(() => [...new Map(records.map((record) => [record.groupId, record.groupTitle])).entries()], [records]);
  const filteredRecords = useMemo(() => sortTarotRecordsNewest(filterTarotRecords(records, filters)), [filters, records]);
  const paginated = useMemo(() => paginateTarotRecords(filteredRecords, page, pageSize), [filteredRecords, page, pageSize]);
  const recentRecord = useMemo(() => sortTarotRecordsNewest(records)[0], [records]);

  const updateFilter = <K extends keyof TarotRecordFilters>(key: K, value: TarotRecordFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
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
      <PageHeader eyebrow="Records Database" title="抽牌資料庫" description="搜尋、查看與維護已儲存的五題抽牌資料。" actions={<><a className="primary-button button-link" href="#/import">匯入新紀錄</a><a className="secondary-button button-link" href="#/analytics">查看統計分析</a></>} />

      {error ? <p className="status-message error" role="alert">{error}</p> : null}
      {notice ? <p className="status-message success" role="status">{notice}</p> : null}

      <section className="ui-stat-grid" aria-label="資料庫摘要">
        <StatCard label="牌卡總筆數" value={records.length} hint="已儲存的單題紀錄" />
        <StatCard label="題組總數" value={groupOptions.length} hint="每組原則上 5 筆" />
        <StatCard label="最近一筆" value={recentRecord ? formatDateForDisplay(recentRecord.observationDate) : "尚無資料"} hint={recentRecord ? `${recentRecord.observationTime} · ${recentRecord.cardName}${recentRecord.orientationLabel}` : "可先匯入第一組紀錄"} />
      </section>

      <section className="panel records-table-panel" aria-labelledby="records-table-title">
        <div className="section-heading"><div><p className="eyebrow">Records</p><h2 id="records-table-title">已儲存抽牌資料</h2></div><span className="status-chip pending">{filteredRecords.length} 筆</span></div>
        <div className="records-filter-toolbar records-filter-toolbar-v3">
          <label className="records-primary-search"><span>搜尋紀錄</span><input type="search" value={filters.keyword} placeholder="輸入題組、題目或牌名" onChange={(event) => updateFilter("keyword", event.target.value)} /></label>
          <div className="records-filter-grid">
              <label><span>開始日期</span><input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} /></label>
              <label><span>結束日期</span><input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} /></label>
              <label><span>題組</span><select value={filters.groupId} onChange={(event) => updateFilter("groupId", event.target.value)}><option value="">全部題組</option>{groupOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
              <label><span>牌卡</span><select value={filters.cardName} onChange={(event) => updateFilter("cardName", event.target.value)}><option value="">全部牌卡</option>{tarotCardNames.map((name) => <option key={name}>{name}</option>)}</select></label>
              <label><span>正逆位</span><select value={filters.orientation} onChange={(event) => updateFilter("orientation", event.target.value as TarotOrientation | "")}><option value="">全部</option><option value="upright">正位</option><option value="reversed">逆位</option></select></label>
              <button className="ghost-button" type="button" onClick={() => { setFilters(DEFAULT_TAROT_RECORD_FILTERS); setPage(1); }}>清除全部篩選</button>
          </div>
        </div>

        {loadingRecords ? <div className="records-placeholder"><strong>載入抽牌紀錄中…</strong></div> : paginated.total === 0 ? <EmptyState title="沒有符合條件的紀錄" description="調整篩選條件，或先匯入第一組五題紀錄。" action={<a className="primary-button button-link" href="#/import">前往紀錄匯入</a>} /> : (
          <div className="records-data-table-wrap"><table className="records-data-table"><thead><tr><th>日期</th><th>時間</th><th>題組</th><th>題序</th><th>題目</th><th>牌卡</th><th>正逆位</th><th>操作</th></tr></thead><tbody>
            {paginated.records.map((record) => {
              const editing = editingId === record.id && editFields;
              return <tr key={record.id}>
                <td>{formatDateForDisplay(record.observationDate)}</td><td>{record.observationTime}</td><td><strong>{record.groupTitle}</strong><small>{record.groupId}</small></td><td>{record.questionOrder}</td>
                <td>{editing ? <textarea value={editFields.questionText} onChange={(event) => setEditFields({ ...editFields, questionText: event.target.value })} /> : record.questionText}</td>
                <td>{editing ? <select value={editFields.cardName} onChange={(event) => setEditFields({ ...editFields, cardName: event.target.value })}>{tarotCardNames.map((name) => <option key={name}>{name}</option>)}</select> : record.cardName}</td>
                <td>{editing ? <select value={editFields.orientation} onChange={(event) => setEditFields({ ...editFields, orientation: event.target.value as TarotOrientation })}><option value="upright">正位</option><option value="reversed">逆位</option></select> : record.orientationLabel}</td>
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
