import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { tarotCardNames } from "../data/tarotCardCatalog";
import {
  DEFAULT_TAROT_RECORD_FILTERS,
  filterTarotRecords,
  paginateTarotRecords,
  sortTarotRecords,
  sortTarotRecordsNewest,
} from "../features/records/logic/tarotRecordCollection";
import {
  buildRecordDetailHash,
  buildRecordsHash,
  filterRecordsByContainedCards,
  parseRecordFiltersFromHash,
  readTarotRecordViewState,
  summarizeFilteredRecords,
  writeTarotRecordViewState,
  type TarotRecordSortDirection,
} from "../features/records/logic/tarotRecordNavigation";
import { formatDateForDisplay } from "../features/records/parser/observationDateTime";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type {
  ParsedTarotRecord,
  TarotArcanaType,
  TarotOrientation,
  TarotRecordEditableFields,
  TarotRecordFilters,
  TarotSuit,
} from "../features/records/types/tarotRecord";

const orientationLabels = { upright: "正位", reversed: "逆位" } as const;
const arcanaLabels = { major: "大阿爾克那", minor: "小阿爾克那" } as const;
const suitLabels: Record<TarotSuit, string> = { major: "大阿爾克那", cups: "聖杯", swords: "寶劍", wands: "權杖", pentacles: "星幣" };

export function TarotRecordsPage() {
  const initialQuery = useMemo(() => parseRecordFiltersFromHash(), []);
  const initialView = useMemo(() => readTarotRecordViewState(), []);
  const hasUrlFilters = useMemo(() => window.location.hash.includes("?"), []);
  const shouldRestoreView = initialView?.restoreOnReturn === true;
  const restoreHandled = useRef(false);
  const [notice, setNotice] = useState(initialQuery.invalidParameters.length ? "部分網址篩選條件無效，已安全忽略。" : "");
  const [error, setError] = useState("");
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [busyRecordId, setBusyRecordId] = useState("");
  const initialFilters = hasUrlFilters ? initialQuery.filters : initialView?.filters ?? initialQuery.filters;
  const containedCardNames = initialQuery.containsCardNames;
  const [filters, setFilters] = useState<TarotRecordFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.keyword);
  const [page, setPage] = useState(shouldRestoreView ? initialView?.page ?? 1 : 1);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(initialView?.pageSize ?? 25);
  const [sortDirection, setSortDirection] = useState<TarotRecordSortDirection>(initialView?.sortDirection ?? "desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editFields, setEditFields] = useState<TarotRecordEditableFields | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingRecords(true);
    setError("");
    void getTarotRecordService().listRecords().then((items) => {
      if (active) setRecords(items);
    }).catch((reason) => {
      if (active) setError(tarotRecordStorageErrorMessage(reason));
    }).finally(() => {
      if (active) setLoadingRecords(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFilters((current) => current.keyword === searchInput ? current : { ...current, keyword: searchInput });
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    window.history.replaceState(null, "", buildRecordsHash(filters, containedCardNames));
  }, [containedCardNames, filters]);

  useEffect(() => {
    writeTarotRecordViewState({ filters, page, pageSize, sortDirection, scrollY: window.scrollY, restoreOnReturn: false });
  }, [filters, page, pageSize, sortDirection]);

  useEffect(() => {
    if (loadingRecords || restoreHandled.current || !shouldRestoreView || !initialView) return;
    restoreHandled.current = true;
    window.requestAnimationFrame(() => window.scrollTo({ top: initialView.scrollY, behavior: "auto" }));
    writeTarotRecordViewState({ ...initialView, restoreOnReturn: false });
  }, [initialView, loadingRecords, shouldRestoreView]);

  const groupOptions = useMemo(() => [...new Map(records.map((record) => [record.groupId, record.groupTitle])).entries()], [records]);
  const pairDateScopeRecords = useMemo(() => filterTarotRecords(records, {
    ...DEFAULT_TAROT_RECORD_FILTERS,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  }), [filters.dateFrom, filters.dateTo, records]);
  const containedRecords = useMemo(() => filterRecordsByContainedCards(pairDateScopeRecords, containedCardNames), [containedCardNames, pairDateScopeRecords]);
  const filteredRecords = useMemo(() => sortTarotRecords(filterTarotRecords(containedRecords, filters), sortDirection), [containedRecords, filters, sortDirection]);
  const paginated = useMemo(() => paginateTarotRecords(filteredRecords, page, pageSize), [filteredRecords, page, pageSize]);
  const recentRecord = useMemo(() => sortTarotRecordsNewest(records)[0], [records]);
  const filteredSummary = useMemo(() => summarizeFilteredRecords(filteredRecords), [filteredRecords]);

  const activeFilters = useMemo(() => {
    const entries: Array<{ key: keyof TarotRecordFilters; label: string }> = [];
    if (filters.keyword) entries.push({ key: "keyword", label: `關鍵字：${filters.keyword}` });
    if (filters.dateFrom) entries.push({ key: "dateFrom", label: `起日：${filters.dateFrom.replace(/-/g, "/")}` });
    if (filters.dateTo) entries.push({ key: "dateTo", label: `迄日：${filters.dateTo.replace(/-/g, "/")}` });
    if (filters.groupId) entries.push({ key: "groupId", label: `題組：${groupOptions.find(([id]) => id === filters.groupId)?.[1] ?? filters.groupId}` });
    if (filters.cardName) entries.push({ key: "cardName", label: `牌卡：${filters.cardName}` });
    if (filters.orientation) entries.push({ key: "orientation", label: orientationLabels[filters.orientation] });
    if (filters.arcanaType) entries.push({ key: "arcanaType", label: arcanaLabels[filters.arcanaType] });
    if (filters.suit) entries.push({ key: "suit", label: `牌組：${suitLabels[filters.suit]}` });
    return entries;
  }, [filters, groupOptions]);

  const updateFilter = <K extends keyof TarotRecordFilters>(key: K, value: TarotRecordFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    if (key === "keyword") setSearchInput(String(value));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_TAROT_RECORD_FILTERS);
    setSearchInput("");
    setPage(1);
  };

  const markDetailNavigation = () => {
    writeTarotRecordViewState({ filters, page: paginated.page, pageSize, sortDirection, scrollY: window.scrollY, restoreOnReturn: true });
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
    if (!window.confirm(`確定刪除第 ${record.questionOrder} 題「${record.cardName}${record.orientationLabel}」？刪除後題組可能不再完整。`)) return;
    if (!window.confirm("請再次確認：這筆抽牌紀錄將永久刪除。")) return;
    setBusyRecordId(record.id);
    setError("");
    try {
      await getTarotRecordService().deleteRecord(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setNotice("已刪除一筆抽牌紀錄。");
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setBusyRecordId("");
    }
  };

  const deleteGroup = async (record: ParsedTarotRecord) => {
    if (!window.confirm(`確定刪除題組「${record.groupTitle}」的全部紀錄？`)) return;
    if (!window.confirm(`請再次確認：題組 ${record.groupId} 及其牌卡紀錄將永久刪除。`)) return;
    setBusyRecordId(record.groupId);
    setError("");
    try {
      const deleted = await getTarotRecordService().deleteGroup(record.groupId);
      setRecords((current) => current.filter((item) => item.groupId !== record.groupId));
      setNotice(`已刪除題組及 ${deleted} 筆牌卡紀錄。`);
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setBusyRecordId("");
    }
  };

  return (
    <main className="content-page records-page">
      <PageHeader eyebrow="Records Database" title="抽牌資料庫" description="搜尋、篩選與維護已儲存的五題抽牌資料。" actions={<><a className="primary-button button-link" href="#/import">匯入紀錄</a><a className="secondary-button button-link" href="#/analytics">前往統計分析</a></>} />

      {error ? <p className="status-message error" role="alert">{error}</p> : null}
      {notice ? <p className="status-message success" role="status">{notice}</p> : null}

      <section className="ui-stat-grid" aria-label="抽牌資料摘要">
        <StatCard label="牌卡紀錄" value={records.length} hint="已儲存的單張牌" />
        <StatCard label="題組數量" value={groupOptions.length} hint="每個完整題組原則上 5 張" />
        <StatCard label="最近一筆" value={recentRecord ? formatDateForDisplay(recentRecord.observationDate) : "尚無資料"} hint={recentRecord ? `${recentRecord.observationTime} · ${recentRecord.cardName}${recentRecord.orientationLabel}` : "請先匯入抽牌紀錄"} />
      </section>

      <section className="panel records-table-panel" aria-labelledby="records-table-title">
        <div className="section-heading"><div><p className="eyebrow">Records</p><h2 id="records-table-title">已儲存紀錄</h2></div><span className="status-chip pending">{filteredSummary.appearances} 次出現 · {filteredSummary.groups} 個題組</span></div>
        {containedCardNames.length ? <div className="records-pair-filter-summary"><div><span>共同出現條件</span><strong>{containedCardNames.join(" × ")}</strong></div><p>共 {containedCardNames.length === 2 ? new Set(containedRecords.map((record) => record.groupId)).size : containedRecords.filter((record) => record.normalizedCardName === containedCardNames[0]).length} 次共同出現 · 涉及 {new Set(containedRecords.map((record) => record.groupId)).size} 組題組</p><a className="ghost-button compact-button button-link" href="#/cooccurrence">返回共現分析</a></div> : null}
        <div className="records-filter-toolbar records-filter-toolbar-v3">
          <label className="records-primary-search"><span>搜尋紀錄</span><input type="search" value={searchInput} placeholder="輸入題組、題目或牌名" onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") updateFilter("keyword", searchInput); }} /></label>
          <button className="secondary-button records-mobile-filter-toggle" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)}>篩選 {activeFilters.length ? `(${activeFilters.length})` : ""}</button>
          <div className={`records-filter-grid ${filtersOpen ? "is-open" : ""}`}>
            <label><span>開始日期</span><input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} /></label>
            <label><span>結束日期</span><input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} /></label>
            <label><span>題組</span><select value={filters.groupId} onChange={(event) => updateFilter("groupId", event.target.value)}><option value="">全部題組</option>{groupOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
            <label><span>牌卡</span><select value={filters.cardName} onChange={(event) => updateFilter("cardName", event.target.value)}><option value="">全部牌卡</option>{tarotCardNames.map((name) => <option key={name}>{name}</option>)}</select></label>
            <label><span>正逆位</span><select value={filters.orientation} onChange={(event) => updateFilter("orientation", event.target.value as TarotOrientation | "")}><option value="">全部方向</option><option value="upright">正位</option><option value="reversed">逆位</option></select></label>
            <label><span>牌類</span><select value={filters.arcanaType} onChange={(event) => updateFilter("arcanaType", event.target.value as TarotArcanaType | "")}><option value="">全部牌類</option><option value="major">大阿爾克那</option><option value="minor">小阿爾克那</option></select></label>
            <label><span>牌組</span><select value={filters.suit} onChange={(event) => updateFilter("suit", event.target.value as TarotSuit | "")}><option value="">全部牌組</option><option value="cups">聖杯</option><option value="swords">寶劍</option><option value="wands">權杖</option><option value="pentacles">星幣</option></select></label>
            <label><span>日期排序</span><select value={sortDirection} onChange={(event) => { setSortDirection(event.target.value as TarotRecordSortDirection); setPage(1); }}><option value="desc">最新優先</option><option value="asc">最舊優先</option></select></label>
            <button className="ghost-button" type="button" onClick={clearFilters}>清除全部篩選</button>
          </div>
          {activeFilters.length ? <div className="records-active-filters" aria-label="目前篩選條件"><strong>目前篩選</strong>{activeFilters.map((item) => <button type="button" key={item.key} onClick={() => updateFilter(item.key, "" as never)} aria-label={`移除${item.label}篩選`}>{item.label}<span aria-hidden="true">×</span></button>)}</div> : null}
        </div>

        {loadingRecords ? <div className="records-placeholder"><strong>{activeFilters.length ? "正在載入相關紀錄…" : "正在載入抽牌紀錄…"}</strong></div> : paginated.total === 0 ? <EmptyState title="沒有符合篩選條件的紀錄" description="請調整或清除篩選條件；尚未建立資料時可先匯入一個完整題組。" action={<button className="secondary-button" type="button" onClick={clearFilters}>清除篩選</button>} /> : (
          <div className="records-data-table-wrap"><table className="records-data-table"><thead><tr><th>日期</th><th>時間</th><th>題組</th><th>題序</th><th>題目</th><th>牌卡</th><th>正逆位</th><th>操作</th></tr></thead><tbody>
            {paginated.records.map((record) => {
              const editing = editingId === record.id && editFields;
              const detailHash = buildRecordDetailHash(record.groupId, buildRecordsHash(filters, containedCardNames));
              return <tr key={record.id}>
                <td>{formatDateForDisplay(record.observationDate)}</td><td>{record.observationTime}</td><td><strong>{record.groupTitle}</strong><small>{record.groupId}</small></td><td>{record.questionOrder}</td>
                <td>{editing ? <textarea value={editFields.questionText} onChange={(event) => setEditFields({ ...editFields, questionText: event.target.value })} /> : record.questionText}</td>
                <td>{editing ? <select value={editFields.cardName} onChange={(event) => setEditFields({ ...editFields, cardName: event.target.value })}>{tarotCardNames.map((name) => <option key={name}>{name}</option>)}</select> : record.cardName}</td>
                <td>{editing ? <select value={editFields.orientation} onChange={(event) => setEditFields({ ...editFields, orientation: event.target.value as TarotOrientation })}><option value="upright">正位</option><option value="reversed">逆位</option></select> : record.orientationLabel}</td>
                <td><div className="records-row-actions">{editing ? <><button className="compact-button primary-button" type="button" disabled={busyRecordId === record.id} onClick={() => void saveEdit()}>儲存</button><button className="compact-button ghost-button" type="button" onClick={() => { setEditingId(""); setEditFields(null); }}>取消</button></> : <><a className="compact-button secondary-button button-link" href={detailHash} onClick={markDetailNavigation}>查看題組</a><button className="compact-button secondary-button" type="button" onClick={() => startEdit(record)}>編輯</button><button className="compact-button ghost-button" type="button" disabled={Boolean(busyRecordId)} onClick={() => void deleteSingleRecord(record)}>刪除</button><button className="compact-button danger-button" type="button" disabled={Boolean(busyRecordId)} onClick={() => void deleteGroup(record)}>刪除題組</button></>}</div></td>
              </tr>;
            })}
          </tbody></table></div>
        )}
        <div className="records-pagination">
          <label>每頁 <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value) as 25 | 50 | 100); setPage(1); }}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select> 筆</label>
          <span>第 {paginated.page} / {paginated.totalPages} 頁</span>
          <div><button className="ghost-button compact-button" type="button" disabled={paginated.page <= 1} onClick={() => setPage((current) => current - 1)}>上一頁</button><button className="ghost-button compact-button" type="button" disabled={paginated.page >= paginated.totalPages} onClick={() => setPage((current) => current + 1)}>下一頁</button></div>
        </div>
      </section>
    </main>
  );
}
