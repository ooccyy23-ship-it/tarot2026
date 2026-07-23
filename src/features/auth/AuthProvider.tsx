import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getFirebaseAuth } from "../../lib/firebase";

export type AuthContextValue = {
  user: User | null;
  initializing: boolean;
  actionLoading: boolean;
  error: string;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function authErrorMessage(reason: unknown): string {
  const code = typeof reason === "object" && reason !== null && "code" in reason
    ? String(reason.code)
    : "";
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google 登入已取消。";
    case "auth/popup-blocked":
      return "瀏覽器封鎖了登入視窗，請允許彈出式視窗後再試。";
    case "auth/unauthorized-domain":
      return "目前網站網域尚未加入 Firebase Authentication 授權網域。";
    case "auth/network-request-failed":
      return "網路連線失敗，請確認網路後再試。";
    default:
      return reason instanceof Error ? reason.message : "登入操作失敗，請稍後再試。";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authRef = useRef<Auth | null>(null);
  const actionInFlight = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      authRef.current = auth;
      return onAuthStateChanged(
        auth,
        (nextUser) => {
          setUser(nextUser);
          setInitializing(false);
        },
        (reason) => {
          setError(authErrorMessage(reason));
          setInitializing(false);
        },
      );
    } catch (reason) {
      setError(authErrorMessage(reason));
      setInitializing(false);
      return undefined;
    }
  }, []);

  const runAction = useCallback(async (operation: (auth: Auth) => Promise<unknown>) => {
    if (actionInFlight.current) return;
    const auth = authRef.current;
    if (!auth) {
      setError("Firebase Authentication 尚未完成初始化。");
      return;
    }
    actionInFlight.current = true;
    setActionLoading(true);
    setError("");
    try {
      await operation(auth);
    } catch (reason) {
      setError(authErrorMessage(reason));
    } finally {
      actionInFlight.current = false;
      setActionLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(
    () => runAction((auth) => signInWithPopup(auth, new GoogleAuthProvider())),
    [runAction],
  );

  const signOutUser = useCallback(
    () => runAction((auth) => signOut(auth)),
    [runAction],
  );

  const value = useMemo<AuthContextValue>(() => ({
    user,
    initializing,
    actionLoading,
    error,
    signInWithGoogle,
    signOutUser,
    clearError: () => setError(""),
  }), [actionLoading, error, initializing, signInWithGoogle, signOutUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
