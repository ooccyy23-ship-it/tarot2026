export function DashboardPage() {
  return (
    <main className="content-page">
      <header className="page-hero dashboard-hero">
        <div>
          <p className="eyebrow">Tarot Draw & Records</p>
          <h1>專注抽牌，留下真正會使用的紀錄。</h1>
          <p>使用時間序號完成單張或五張抽牌，並整理重要的五題牌組紀錄。</p>
        </div>
        <a className="primary-button button-link" href="#/draw">開始抽牌</a>
      </header>

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
            <p className="eyebrow">Records</p>
            <h2>抽牌紀錄</h2>
            <p>貼上、解析、搜尋與查看真正需要保留的五題抽牌資料。</p>
          </div>
          <a className="secondary-button button-link" href="#/records">查看抽牌紀錄</a>
        </article>
      </section>
    </main>
  );
}
