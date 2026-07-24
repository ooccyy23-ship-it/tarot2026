import type { ReactNode } from "react";
import { getAllowedUid, resolveAuthGateState } from "../authAccess";
import { useAuth } from "../useAuth";
import { AuthLoading } from "./AuthLoading";
import { LoginPage } from "./LoginPage";
import { UnauthorizedPage } from "./UnauthorizedPage";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, initializing } = useAuth();
  const state = resolveAuthGateState({
    initializing,
    userUid: user?.uid,
    allowedUid: getAllowedUid(),
  });

  if (state === "loading") return <AuthLoading />;
  if (state === "signed_out") return <LoginPage />;
  if (state === "unauthorized") return <UnauthorizedPage />;
  return <>{children}</>;
}
