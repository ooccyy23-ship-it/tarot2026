import { PageHeader } from "../components/ui/PageHeader";

export function DashboardPage() {
  return (
    <main className="content-page">
      <PageHeader eyebrow="Tarot Validation System" title="塔羅抽牌與研究資料系統" description="使用時間序號完成抽牌，整理重要紀錄並觀察長期資料變化。" actions={<a className="primary-button button-link" href="#/draw">開始抽牌</a>} />

      <section className="home-tool-grid" aria-label="主要功能">
        <article className="home-tool-card home-tool-card-primary">
          <span className="home-tool-number" aria-hidden="true">01</span>
          <div>
            <p className="eyebrow">Draw</p>
            <h2>抽牌工具</h2>
            <p>保留目前完整的時間推算、星期對照、五抽與單抽流程。</p>
          </div>
          <a className="primary-button button-link" href="#/draw">進入抽牌工具</a>
        </article>

        <article className="home-tool-card">
          <span className="home-tool-number" aria-hidden="true">02</span>
          <div>
            <p className="eyebrow">Import</p>
            <h2>紀錄匯入</h2>
            <p>貼上並確認完整五題紀錄，再安全寫入資料庫。</p>
          </div>
          <a className="secondary-button button-link" href="#/import">匯入紀錄</a>
        </article>

        <article className="home-tool-card">
          <span className="home-tool-number" aria-hidden="true">03</span>
          <div><p className="eyebrow">Database</p><h2>抽牌資料庫</h2><p>搜尋、篩選與維護已保存的五題抽牌資料。</p></div>
          <a className="secondary-button button-link" href="#/records">查看資料庫</a>
        </article>

        <article className="home-tool-card">
          <span className="home-tool-number" aria-hidden="true">04</span>
          <div><p className="eyebrow">Analytics</p><h2>統計分析</h2><p>查看牌卡頻率、共現關係與時間趨勢。</p></div>
          <a className="secondary-button button-link" href="#/analytics">開啟分析</a>
        </article>
      </section>
    </main>
  );
}
