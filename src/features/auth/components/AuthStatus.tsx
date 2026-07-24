import { useAuth } from "../useAuth";

export function AuthStatus() {
  const {
    user,
    initializing,
    actionLoading,
    error,
    signInWithGoogle,
    signOutUser,
    clearError,
  } = useAuth();

  if (initializing) {
    return <div className="auth-status is-loading" aria-live="polite">正在確認登入狀態…</div>;
  }

  return (
    <div className="auth-area">
      {user ? (
        <div className="auth-status is-signed-in">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="auth-avatar-fallback" aria-hidden="true">
              {(user.displayName || user.email || "U").slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="auth-user-copy">
            <strong>{user.displayName || "已登入"}</strong>
            {user.email ? <small>{user.email}</small> : null}
          </span>
          <button
            className="auth-button auth-sign-out"
            type="button"
            disabled={actionLoading}
            onClick={() => void signOutUser()}
          >
            {actionLoading ? "處理中…" : "登出"}
          </button>
        </div>
      ) : (
        <button
          className="auth-button auth-sign-in"
          type="button"
          disabled={actionLoading}
          onClick={() => void signInWithGoogle()}
        >
          <span aria-hidden="true">G</span>
          {actionLoading ? "登入中…" : "使用 Google 登入"}
        </button>
      )}
      {error ? (
        <div className="auth-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="關閉登入錯誤">×</button>
        </div>
      ) : null}
    </div>
  );
}
