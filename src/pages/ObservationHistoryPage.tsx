import { useEffect, useMemo, useState } from "react";
import { filterObservations, type ObservationFilters } from "../features/observations/logic/filterObservations";
import { deleteObservation, listObservations } from "../features/observations/storage/database";
import type { Observation } from "../features/observations/types/observation";
import { getEffectiveVerificationStatus, verificationStatusLabels } from "../features/verification/logic/verificationStatus";

const emptyFilters: ObservationFilters = { keyword: "", dateFrom: "", dateTo: "", questionGroupId: "", verificationStatus: "" };

export function ObservationHistoryPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    listObservations().then(setObservations).catch(() => setMessage("無法讀取歷史觀測。")) .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => Array.from(new Map(observations.map((item) => [item.questionGroupId, item.questionGroupSnapshot.title])).entries()), [observations]);
  const visible = useMemo(() => filterObservations(observations, filters), [observations, filters]);
  const updateFilter = (key: keyof ObservationFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  const handleDelete = async (observation: Observation) => {
    if (!window.confirm(`確定要刪除 ${observation.observationDate} 的觀測紀錄嗎？`)) return;
    if (!window.confirm("再次確認：刪除後無法復原。是否繼續？")) return;
    await deleteObservation(observation.id);
    setObservations((current) => current.filter((item) => item.id !== observation.id));
    setMessage("觀測紀錄已刪除。");
  };

  return (
    <main className="content-page">
      <header className="page-title"><div><p className="eyebrow">歷史觀測</p><h1>歷史觀測</h1><p>查找已正式儲存的觀測；抽牌結果僅供查看。</p></div><a className="primary-button button-link" href="#/new">＋新增觀測</a></header>
      <section className="panel history-filter-panel">
        <div className="history-filters">
          <label className="field filter-keyword"><span>關鍵字</span><input className="text-input" value={filters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} placeholder="代稱、主題、背景或題組" /></label>
          <label className="field"><span>起始日期</span><input className="text-input" type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} /></label>
          <label className="field"><span>結束日期</span><input className="text-input" type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} /></label>
          <label className="field"><span>題組</span><select className="select-input" value={filters.questionGroupId} onChange={(event) => updateFilter("questionGroupId", event.target.value)}><option value="">全部題組</option>{groups.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
          <label className="field"><span>驗證狀態</span><select className="select-input" value={filters.verificationStatus} onChange={(event) => updateFilter("verificationStatus", event.target.value)}><option value="">全部狀態</option>{Object.entries(verificationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <div className="filter-footer"><span>顯示 {visible.length}／{observations.length} 筆</span><button className="ghost-button inline-button" type="button" onClick={() => setFilters(emptyFilters)}>清除篩選</button></div>
      </section>
      {message ? <p className="notice-text" role="status">{message}</p> : null}
      {loading ? <section className="panel"><p>正在讀取歷史觀測…</p></section> : null}
      {!loading && observations.length === 0 ? <section className="panel empty-state"><h2>尚未建立觀測紀錄</h2><p>完成步驟 6 後，正式紀錄會顯示在這裡。</p><a className="primary-button button-link" href="#/new">＋新增觀測</a></section> : null}
      {!loading && observations.length > 0 && visible.length === 0 ? <section className="panel empty-state"><h2>找不到符合條件的紀錄</h2><p>請調整或清除篩選條件。</p></section> : null}
      <section className="history-list" aria-label="歷史觀測列表">
        {visible.map((item) => {
          const status = getEffectiveVerificationStatus(item);
          return (
            <article className="history-card" key={item.id}>
              <div className="history-card-main"><div className="history-date"><strong>{item.observationDate}</strong><span>{item.drawTime}</span></div><div className="history-title"><span>{item.subjectAlias || "未填代稱"}</span><h2>{item.topic || item.questionGroupSnapshot.title}</h2><p>{item.questionGroupSnapshot.title}</p></div><span className={`status-chip ${status}`}>{verificationStatusLabels[status]}</span></div>
              <p className="card-summary">{item.drawResult.cards.map((card) => `${card.cardName}${card.orientationLabel}`).join("・")}</p>
              <div className="history-actions"><a className="secondary-button button-link" href={`#/observations/${item.id}`}>查看</a><a className="ghost-button button-link" href={`#/observations/${item.id}?edit=1`}>編輯文字紀錄</a>{status === "pending" || status === "overdue" ? <a className="ghost-button button-link" href={`#/observations/${item.id}?section=verification`}>進入現實驗證</a> : null}<button className="danger-button" type="button" onClick={() => void handleDelete(item)}>刪除</button></div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
