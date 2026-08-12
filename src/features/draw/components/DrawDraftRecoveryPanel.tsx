import type { DrawDraftLoadResult } from "../storage/drawDraftStorage";

export function DrawDraftRecoveryPanel({
  result,
  onRestore,
  onDiscard,
}: {
  result: Exclude<DrawDraftLoadResult, { status: "none" }>;
  onRestore?: () => void;
  onDiscard: () => void;
}) {
  if (result.status === "invalid") {
    return (
      <section className="panel draw-recovery-panel" role="alert">
        <div><p className="eyebrow">未完成抽牌</p><h2>未完成抽牌資料無法完整恢復。</h2></div>
        <div className="actions-row"><button className="danger-button" type="button" onClick={onDiscard}>清除暫存</button></div>
        <details className="details-panel"><summary>查看技術錯誤資訊</summary><ul>{result.errors.map((error) => <li key={error}>{error}</li>)}</ul></details>
      </section>
    );
  }

  const lockedCount = result.draft.cards.filter((card) => card.orientationResult?.locked).length;
  return (
    <section className={`panel draw-recovery-panel ${result.status === "expired" ? "is-expired" : ""}`} role="status">
      <div>
        <p className="eyebrow">{result.status === "expired" ? "過期暫存" : "未完成抽牌"}</p>
        <h2>{result.status === "expired" ? "發現已過期的未完成抽牌" : "發現一筆尚未完成的抽牌"}</h2>
        <p>{result.draft.questionGroupName} · 開始於 {new Date(result.draft.createdAt).toLocaleString("zh-TW")}</p>
        <p>已完成進度：{lockedCount} / {result.draft.mode === "five" ? 5 : 1} 張正逆位</p>
      </div>
      <div className="actions-row">
        {onRestore ? <button className="primary-button" type="button" onClick={onRestore}>{result.status === "expired" ? "仍要查看" : "繼續抽牌"}</button> : null}
        <button className="ghost-button" type="button" onClick={onDiscard}>{result.status === "expired" ? "清除" : "放棄並重新開始"}</button>
      </div>
    </section>
  );
}
