import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusMessage } from "../components/StatusMessage";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import {
  activeResearchSessions,
  buildPendingActions,
  completedResearchCount,
  formatDateTime,
  formatFullDate,
  formatShortDate,
  groupFormalRecords,
  groupsInRecentDays,
  localDateKey,
  sessionTimingLabel,
} from "../features/dashboard/logic/researchDashboard";
import { listStoredDraftDraws } from "../features/draw/storage/drawDraftStorage";
import { loadTarotImportDraft } from "../features/records/storage/tarotImportDraftStorage";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type { ParsedTarotRecord } from "../features/records/types/tarotRecord";
import { ResearchStatusBadge } from "../features/researchSessions/components/ResearchStatusBadge";
import { getSevenDaySessionService } from "../features/researchSessions/storage/sevenDaySessionService";
import type { ResearchSession } from "../features/researchSessions/types/researchSession";

export function DashboardPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = useMemo(() => localDateKey(), []);
  const drawDrafts = useMemo(() => listStoredDraftDraws(), []);
  const importDraft = useMemo(() => loadTarotImportDraft(), []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sessionItems, recordItems] = await Promise.all([
        getSevenDaySessionService().list(),
        getTarotRecordService().listRecords(),
      ]);
      setSessions(sessionItems);
      setRecords(recordItems);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tarotRecordStorageErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const groups = useMemo(() => groupFormalRecords(records), [records]);
  const activeSessions = useMemo(() => activeResearchSessions(sessions), [sessions]);
  const validationDueCount = useMemo(() => sessions.filter((session) => session.status === "validation_due").length, [sessions]);
  const todayGroups = useMemo(() => groups.filter((group) => group.observationDate === today), [groups, today]);
  const recentGroups = useMemo(() => groups.slice(0, 5), [groups]);
  const pendingActions = useMemo(() => buildPendingActions({ sessions, today, hasDrawDraft: drawDrafts.length > 0, hasImportDraft: Boolean(importDraft) }), [drawDrafts.length, importDraft, sessions, today]);
  const latestGroup = groups[0];

  return (
    <main className="content-page research-dashboard">
      <PageHeader
        eyebrow="Research Dashboard"
        title="研究 Dashboard"
        description="私人塔羅現實驗證研究工作台：掌握進行中的研究、待處理事項與最近正式紀錄。"
        actions={<button className="secondary-button" type="button" disabled={loading} onClick={() => void loadDashboard()}>{loading ? "讀取中…" : "重新整理"}</button>}
      />

      {error ? <StatusMessage tone="error" message={`研究資料讀取失敗：${error}`} /> : null}
      {loading ? (
        <section className="panel dashboard-loading" aria-live="polite"><span className="dashboard-loading-mark" aria-hidden="true" /><div><strong>正在讀取研究資料……</strong><p>完成後會顯示最新 Session、待處理事項與正式紀錄。</p></div></section>
      ) : (
        <>
          <section className="dashboard-today" aria-labelledby="dashboard-today-title">
            <div><p className="eyebrow">Today</p><h2 id="dashboard-today-title">今天是 {formatFullDate(today)}</h2></div>
            <dl>
              <div><dt>進行中研究</dt><dd>{activeSessions.length}</dd></div>
              <div><dt>待驗證</dt><dd>{validationDueCount}</dd></div>
              <div><dt>今日抽牌</dt><dd>{todayGroups.length} 組</dd></div>
              <div><dt>最近儲存</dt><dd>{latestGroup ? latestGroup.observationTime : "—"}</dd></div>
            </dl>
          </section>

          <div className="dashboard-primary-grid">
            <section className="panel dashboard-section dashboard-pending" aria-labelledby="dashboard-pending-title">
              <div className="dashboard-section-heading"><div><p className="eyebrow">Pending</p><h2 id="dashboard-pending-title">待處理</h2></div><span>{pendingActions.length} 項</span></div>
              {pendingActions.length === 0 ? <p className="dashboard-compact-empty">目前沒有需要處理的研究事項。</p> : <div className="dashboard-action-list">{pendingActions.map((item) => <article className={`dashboard-action-item ${item.tone}`} key={item.id}><div><strong>{item.title}</strong><p>{item.description}</p></div><a className="secondary-button compact-button" href={item.href}>{item.actionLabel}</a></article>)}</div>}
            </section>

            <section className="panel dashboard-section dashboard-active" aria-labelledby="dashboard-active-title">
              <div className="dashboard-section-heading"><div><p className="eyebrow">Active Research</p><h2 id="dashboard-active-title">進行中的研究</h2></div><a href="#/research">查看全部</a></div>
              {activeSessions.length === 0 ? <EmptyState title="目前沒有進行中的研究" description="建立新的 7 天研究後，可在這裡查看題組進度與驗證期限。" action={<a className="secondary-button button-link" href="#/research">開始新的 7 天研究</a>} /> : <div className="dashboard-session-list">{activeSessions.slice(0, 3).map((session) => <article className="dashboard-session-card" key={session.sessionId}><header><div><span>7 天研究</span><strong>{session.sessionId}</strong></div><ResearchStatusBadge status={session.status} /></header><dl><div><dt>研究期間</dt><dd>{formatShortDate(session.startDate)} → {formatShortDate(session.validationDeadline)}</dd></div><div><dt>剩餘</dt><dd>{sessionTimingLabel(session, today)}</dd></div><div><dt>題組</dt><dd>{(["A", "B", "C"] as const).map((set) => <span className={session.completedSets.includes(set) ? "is-done" : ""} key={set}>{set}{session.completedSets.includes(set) ? " ✓" : ""}</span>)}</dd></div></dl><a className="secondary-button compact-button" href={`#/research/${encodeURIComponent(session.sessionId)}`}>查看研究</a></article>)}</div>}
            </section>
          </div>

          <section className="panel dashboard-section dashboard-quick" aria-labelledby="dashboard-quick-title">
            <div className="dashboard-section-heading"><div><p className="eyebrow">Quick Actions</p><h2 id="dashboard-quick-title">快速操作</h2></div></div>
            <div className="dashboard-quick-actions"><a href="#/draw?mode=five"><span>01</span><strong>新的五張抽牌</strong></a><a href="#/draw?mode=single"><span>02</span><strong>單張抽牌</strong></a><a href="#/research"><span>03</span><strong>7 天研究</strong></a><a href="#/records"><span>04</span><strong>抽牌資料庫</strong></a><a href="#/analytics"><span>05</span><strong>統計分析</strong></a></div>
          </section>

          <div className="dashboard-secondary-grid">
            <section className="panel dashboard-section dashboard-recent" aria-labelledby="dashboard-recent-title">
              <div className="dashboard-section-heading"><div><p className="eyebrow">Recent Records</p><h2 id="dashboard-recent-title">最近抽牌紀錄</h2></div><a href="#/records">查看資料庫</a></div>
              {recentGroups.length === 0 ? <EmptyState title="尚無正式抽牌紀錄" description="完成抽牌並匯入正式紀錄後，最近結果會顯示在這裡。" action={<a className="secondary-button button-link" href="#/draw">開始抽牌</a>} /> : <div className="dashboard-record-list">{recentGroups.map((group) => <article key={group.groupId}><div><time dateTime={`${group.observationDate}T${group.observationTime}`}>{formatDateTime(group.observationDate, group.observationTime)}</time><strong>{group.groupTitle}</strong><p>{group.cards.map((card) => `${card.cardName}${card.orientationLabel === "正位" ? "正" : "逆"}`).join(" · ")}</p></div><a href={`#/records/detail?groupId=${encodeURIComponent(group.groupId)}`}>查看詳情</a></article>)}</div>}
            </section>

            <section className="panel dashboard-section dashboard-summary" aria-labelledby="dashboard-summary-title">
              <div className="dashboard-section-heading"><div><p className="eyebrow">Summary</p><h2 id="dashboard-summary-title">簡要研究統計</h2></div></div>
              <dl><div><dt>正式紀錄總數</dt><dd>{groups.length} 組</dd></div><div><dt>正式牌卡總數</dt><dd>{records.length} 張</dd></div><div><dt>已完成研究</dt><dd>{completedResearchCount(sessions)} 個</dd></div><div><dt>最近 7 天新增</dt><dd>{groupsInRecentDays(groups, today, 7)} 組</dd></div></dl>
              <a className="secondary-button button-link" href="#/analytics">查看完整統計</a>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
