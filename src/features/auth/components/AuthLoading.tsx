export function AuthLoading() {
  return (
    <main className="auth-gate-page" aria-busy="true">
      <section className="auth-gate-card auth-loading-card" role="status" aria-live="polite">
        <span className="auth-gate-mark" aria-hidden="true">T</span>
        <h1>塔羅現實驗證研究系統</h1>
        <p>正在確認登入狀態…</p>
        <span className="auth-loading-indicator" aria-hidden="true" />
      </section>
    </main>
  );
}
