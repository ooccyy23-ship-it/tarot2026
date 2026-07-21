import { useEffect, useState } from "react";
import { listObservations } from "../features/observations/storage/database";
import type { Observation } from "../features/observations/types/observation";

export function DashboardPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listObservations()
      .then(setObservations)
      .catch((error) => console.error("讀取首頁摘要失敗", error))
      .finally(() => setLoaded(true));
  }, []);

  const pendingCount = observations.filter((item) => item.verification.status === "pending").length;
  const completedCount = observations.filter((item) => item.drawResult?.completedAt).length;
  const latest = [...observations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <main className="content-page">
      <header className="page-hero dashboard-hero">
        <div>
          <p className="eyebrow">Tarot Observation v2</p>
          <h1>把抽牌留在當下，也把答案交給現實。</h1>
          <p>記錄抽牌前狀態、五張牌與後續驗證，讓每次觀測保有完整脈絡。</p>
        </div>
        <a className="primary-button button-link" href="#/new">＋新增觀測</a>
      </header>

      <section className="summary-grid" aria-label="觀測摘要">
        <article className="summary-card"><span>新增觀測</span><strong>開始一筆</strong><a href="#/new">進入流程</a></article>
        <article className="summary-card"><span>待驗證紀錄數</span><strong>{loaded ? pendingCount : "—"}</strong><a href="#/pending">查看待驗證</a></article>
        <article className="summary-card"><span>已完成觀測數</span><strong>{loaded ? completedCount : "—"}</strong><a href="#/history">查看歷史</a></article>
        <article className="summary-card"><span>最近一次觀測</span><strong className="summary-date">{latest ? `${latest.observationDate} ${latest.drawTime}` : "尚無紀錄"}</strong><a href="#/history">查看詳情</a></article>
      </section>

      {loaded && observations.length === 0 ? (
        <section className="panel empty-state">
          <div className="empty-icon" aria-hidden="true">＋</div>
          <h2>尚未建立觀測紀錄</h2>
          <p>建立第一筆觀測後，將可在這裡查看進度。</p>
          <a className="primary-button button-link" href="#/new">建立第一筆觀測</a>
        </section>
      ) : null}
    </main>
  );
}
