import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { importDataFromJson, serializeData, type DataSnapshot, type ImportRepository } from "../features/observations/logic/dataTransfer";
import {
  clearAllData,
  listObservations,
  listQuestionGroups,
  listSettings,
  saveObservation,
  saveQuestionGroup,
  saveSetting,
} from "../features/observations/storage/database";

async function readSnapshot(): Promise<DataSnapshot> {
  const [observations, questionGroups, settings] = await Promise.all([listObservations(), listQuestionGroups(), listSettings()]);
  return { observations, questionGroups, settings };
}

const repository: ImportRepository = {
  snapshot: readSnapshot,
  saveObservation,
  saveQuestionGroup,
  saveSetting,
};

export function DataManagementPage() {
  const [snapshot, setSnapshot] = useState<DataSnapshot>({ observations: [], questionGroups: [], settings: [] });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"info" | "error" | "success">("info");
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const data = await readSnapshot();
    setSnapshot(data);
    setLoaded(true);
  };

  useEffect(() => {
    refresh().catch(() => { setMessage("無法讀取本機資料摘要。"); setTone("error"); setLoaded(true); });
  }, []);

  const exportAll = () => {
    const json = serializeData(snapshot);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tarot-observation-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    setTone("success");
    setMessage(`已匯出 ${snapshot.observations.length} 筆觀測與 ${snapshot.questionGroups.length} 個題組。`);
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await importDataFromJson(await file.text(), repository);
      await refresh();
      setTone("success");
      setMessage(`匯入完成：${result.imported.observations} 筆觀測、${result.imported.questionGroups} 個題組、${result.imported.settings} 筆設定；${result.skipped} 筆略過。匯入前備份已保存在本機。`);
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "JSON 匯入失敗，既有資料未變更。");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const clearData = async () => {
    if (!window.confirm("第一次確認：確定要清除所有本機觀測、題組與設定嗎？")) return;
    if (!window.confirm("第二次確認：此操作無法復原。請確認已匯出 JSON 備份。")) return;
    setBusy(true);
    try {
      await clearAllData();
      await refresh();
      setTone("success");
      setMessage("所有本機資料已清除。若未事先匯出，資料無法復原。");
    } catch {
      setTone("error");
      setMessage("清除本機資料失敗，請重新整理後再試一次。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="content-page">
      <header className="page-title"><div><p className="eyebrow">資料管理</p><h1>本機資料與備份</h1><p>匯出、匯入或清除儲存在此瀏覽器 IndexedDB 的資料。</p></div><span className="status-chip verified">可使用</span></header>
      <section className="data-summary-grid" aria-label="本機資料摘要">
        <article className="summary-card"><span>觀測紀錄</span><strong>{loaded ? snapshot.observations.length : "—"}</strong></article>
        <article className="summary-card"><span>題組</span><strong>{loaded ? snapshot.questionGroups.length : "—"}</strong></article>
        <article className="summary-card"><span>本機設定</span><strong>{loaded ? snapshot.settings.length : "—"}</strong></article>
      </section>
      {message ? <p className={`status-message ${tone}`} role="status">{message}</p> : null}
      <section className="data-management-grid">
        <article className="panel data-action-card"><div><p className="eyebrow">JSON 備份</p><h2>匯出全部資料</h2><p>下載觀測、題組與本機設定。備份內容可能含私人紀錄，請妥善保存。</p></div><button className="primary-button" type="button" disabled={!loaded || busy} onClick={exportAll}>匯出全部資料為 JSON</button></article>
        <article className="panel data-action-card"><div><p className="eyebrow">安全匯入</p><h2>從 JSON 匯入資料</h2><p>先驗證格式並建立本機備份，再逐筆合併有效資料；錯誤資料會略過。</p></div><input ref={fileInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importFile(event)} /><button className="secondary-button" type="button" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? "處理中…" : "選擇 JSON 檔案"}</button></article>
        <article className="panel data-action-card danger-zone"><div><p className="eyebrow">危險操作</p><h2>清除所有本機資料</h2><p>會清除觀測、題組、草稿、設定與匯入備份，必須通過兩次確認。</p></div><button className="danger-button" type="button" disabled={busy} onClick={() => void clearData()}>清除所有本機資料</button></article>
      </section>
      <section className="panel safety-note"><h2>資料安全提醒</h2><p>清除瀏覽器資料或更換裝置可能導致資料遺失。請定期匯出 JSON，且不要將含私人內容的備份提交到公開 GitHub Repository。</p></section>
    </main>
  );
}
