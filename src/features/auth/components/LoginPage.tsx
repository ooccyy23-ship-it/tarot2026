import { useAuth } from "../useAuth";

export function LoginPage() {
  const {
    actionLoading,
    error,
    signInWithGoogle,
    clearError,
  } = useAuth();

  return (
    <main className="auth-gate-page">
      <section className="auth-gate-card">
        <span className="auth-gate-mark" aria-hidden="true">T</span>
        <p className="eyebrow">PRIVATE RESEARCH TOOL</p>
        <h1>塔羅現實驗證研究系統</h1>
        <p className="auth-gate-description">
          本系統為私人研究工具，僅供指定帳號記錄抽牌、觀測事件與現實驗證結果。
        </p>
        <button
          className="auth-google-button"
          type="button"
          disabled={actionLoading}
          onClick={() => void signInWithGoogle()}
        >
          <span aria-hidden="true">G</span>
          {actionLoading ? "登入中…" : "使用 Google 帳號登入"}
        </button>
        {error ? (
          <div className="auth-gate-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={clearError} aria-label="關閉登入錯誤">×</button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
