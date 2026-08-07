export function tarotRecordStorageErrorMessage(reason: unknown): string {
  const code = typeof reason === "object" && reason !== null && "code" in reason ? String(reason.code) : "";
  if (code.includes("permission-denied")) return "Firestore 權限不足，請確認已登入授權帳號並部署最新 Rules。";
  if (code.includes("unavailable")) return "Firestore 目前無法連線，請檢查網路後再試。";
  return reason instanceof Error ? reason.message : "資料操作失敗，請稍後再試。";
}
