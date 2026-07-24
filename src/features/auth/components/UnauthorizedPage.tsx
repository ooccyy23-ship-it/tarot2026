import { useAuth } from "../useAuth";

export function UnauthorizedPage() {
  const {
    user,
    actionLoading,
    error,
    signOutUser,
    clearError,
  } = useAuth();

  return (
    <main className="auth-gate-page">
      <section className="auth-gate-card">
        <span className="auth-gate-mark is-denied" aria-hidden="true">!</span>
        <p className="eyebrow">ACCESS DENIED</p>
        <h1>此帳號沒有系統使用權限</h1>
        <p className="auth-gate-description">
          目前登入的 Google 帳號不在本系統的授權名單中。
        </p>
        <div className="auth-denied-account">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : null}
          <span>
            <strong>{user?.displayName || "未授權帳號"}</strong>
            {user?.email ? <small>{user.email}</small> : null}
          </span>
        </div>
        <button
          className="auth-google-button is-sign-out"
          type="button"
          disabled={actionLoading}
          onClick={() => void signOutUser()}
        >
          {actionLoading ? "登出中…" : "登出此帳號"}
        </button>
        {error ? (
          <div className="auth-gate-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={clearError} aria-label="關閉錯誤">×</button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
