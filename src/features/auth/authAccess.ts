export type AuthGateState =
  | "loading"
  | "signed_out"
  | "unauthorized"
  | "authorized";

export const DEFAULT_ALLOWED_UID = "JGvYos4FHLgTD7YQxT4dn4WVryd2";

export function getAllowedUid(): string {
  return (import.meta.env.VITE_ALLOWED_UID ?? "").trim() || DEFAULT_ALLOWED_UID;
}

export function isAllowedUid(uid: string | undefined | null, allowedUid: string): boolean {
  return Boolean(uid && allowedUid && uid === allowedUid);
}

export function resolveAuthGateState({
  initializing,
  userUid,
  allowedUid,
}: {
  initializing: boolean;
  userUid?: string | null;
  allowedUid: string;
}): AuthGateState {
  if (initializing) return "loading";
  if (!userUid) return "signed_out";
  return isAllowedUid(userUid, allowedUid) ? "authorized" : "unauthorized";
}
