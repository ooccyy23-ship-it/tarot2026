import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { tarotCardNames } from "../data/tarotCardCatalog";
import { RecordTypeBadge } from "../features/records/components/RecordTypeBadge";
import { buildOpenObservationGroup, createOpenObservationCode, validateOpenObservation, type OpenObservationInput } from "../features/records/logic/openObservation";
import { clearOpenObservationPrefill, loadOpenObservationPrefill } from "../features/records/storage/openObservationDraftStorage";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type { TarotOrientation } from "../features/records/types/tarotRecord";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { getSystemWeekday, getWeekdayLabel } from "../logic/weekday";

function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localTime(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function blankInput(): OpenObservationInput {
  const now = new Date();
  return {
    source: "manual_text",
    observationDate: localDate(now),
    drawTime: localTime(now),
    weekdayLabel: getWeekdayLabel(getSystemWeekday(now)),
    drawMethod: "手動建立",
    note: "",
    cards: Array.from({ length: 5 }, (_, index) => ({ position: index + 1, serialNumber: null, cardName: "", orientation: "" })),
  };
}

export function OpenObservationPage() {
  const prefill = useMemo(loadOpenObservationPrefill, []);
  const [input, setInput] = useState<OpenObservationInput>(prefill ?? blankInput());
  const [saving, setSaving] = useState(false);
  const [savedGroupId, setSavedGroupId] = useState("");
  const [error, setError] = useState("");
  const online = useOnlineStatus();
  const errors = useMemo(() => validateOpenObservation(input), [input]);
  const dirty = !savedGroupId && (Boolean(prefill) || input.cards.some((card) => card.cardName || card.orientation || card.serialNumber !== null) || Boolean(input.note.trim()));

  useEffect(() => {
    const date = new Date(`${input.observationDate}T12:00:00`);
    if (!Number.isNaN(date.getTime())) setInput((current) => ({ ...current, weekdayLabel: getWeekdayLabel(getSystemWeekday(date)) }));
  }, [input.observationDate]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const routeChange = (event: Event) => {
      if (!window.confirm("這筆無題觀測尚未儲存，確定要離開嗎？")) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("tarot:before-route-change", routeChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("tarot:before-route-change", routeChange);
    };
  }, [dirty]);

  const updateCard = (index: number, patch: Partial<OpenObservationInput["cards"][number]>) => {
    setInput((current) => ({ ...current, cards: current.cards.map((card, cardIndex) => cardIndex === index ? { ...card, ...patch } : card) }));
    setError("");
  };

  const save = async () => {
    if (saving || errors.length) { if (errors.length) setError(errors[0]); return; }
    if (!online) { setError("目前網路已中斷，無法儲存至雲端。請恢復連線後重試。"); return; }
    setSaving(true); setError("");
    try {
      const saved = await getTarotRecordService().saveGroup(buildOpenObservationGroup(input));
      clearOpenObservationPrefill();
      setSavedGroupId(saved.groupId);
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  if (savedGroupId) return <main className="content-page open-observation-page">
    <PageHeader eyebrow="Open Observation" title="無題觀測" description="建立一筆不含預設題義的五張牌觀測紀錄" />
    <section className="panel open-observation-success" aria-live="polite"><p className="eyebrow">Save Complete</p><h2>無題觀測已儲存</h2><p>{createOpenObservationCode(input.observationDate, input.drawTime)} 已安全寫入雲端。</p><div className="actions-row"><a className="primary-button button-link" href={`#/records/detail?groupId=${encodeURIComponent(savedGroupId)}`}>查看這筆觀測</a><button className="secondary-button" type="button" onClick={() => { setInput(blankInput()); setSavedGroupId(""); }}>建立另一筆</button><a className="ghost-button button-link" href="#/records">前往抽牌資料庫</a></div></section>
  </main>;

  return <main className="content-page open-observation-page">
    <PageHeader
      eyebrow="Open Observation"
      title="無題觀測"
      description="建立一筆不含預設題義的五張牌觀測紀錄"
      actions={<div className="open-observation-page-meta"><span>Observation ID</span><strong>{createOpenObservationCode(input.observationDate, input.drawTime)}</strong><RecordTypeBadge recordType="open_observation" /></div>}
    />
    {input.source === "draw_result" ? <p className="status-message success" role="status">已從完成的五牌抽取帶入，請確認後儲存。</p> : null}
    {error ? <p className="status-message error" role="alert">{error}</p> : null}
    <section className="panel open-observation-form">
      <section className="open-observation-section" aria-labelledby="open-observation-metadata-title">
        <div className="open-observation-section-heading"><p className="eyebrow">Observation Metadata</p><h2 id="open-observation-metadata-title">觀測資訊</h2></div>
        <div className="open-observation-meta-grid">
          <label><span>觀測日期</span><input type="date" value={input.observationDate} onChange={(event) => setInput((current) => ({ ...current, observationDate: event.target.value }))} /></label>
          <label><span>抽牌時間</span><input type="time" value={input.drawTime} onChange={(event) => setInput((current) => ({ ...current, drawTime: event.target.value }))} /></label>
          <label><span>星期</span><input value={input.weekdayLabel} readOnly /></label>
          <label><span>建立方式</span><input value={input.drawMethod} onChange={(event) => setInput((current) => ({ ...current, drawMethod: event.target.value }))} /></label>
        </div>
      </section>

      <section className="open-observation-section open-observation-records" aria-labelledby="open-observation-records-title">
        <div className="open-observation-section-heading"><p className="eyebrow">Card Records</p><h2 id="open-observation-records-title">牌卡紀錄</h2><p>位置僅代表抽牌順序，不預設任何牌義。</p></div>
        <div className="open-observation-table" role="table" aria-label="五張牌卡紀錄">
          <div className="open-observation-table-header" role="row">
            <span role="columnheader">位置</span><span role="columnheader">序號（選填）</span><span role="columnheader">牌卡</span><span role="columnheader">正逆位</span>
          </div>
          <div className="open-observation-card-list" role="rowgroup">
            {input.cards.map((card, index) => <div key={card.position} className="open-observation-card-row" role="row">
              <strong className="open-observation-position" role="cell">{String(card.position).padStart(2, "0")}</strong>
              <div role="cell"><label><span className="open-observation-mobile-label">序號（選填）</span><input aria-label={`第 ${card.position} 張序號（選填）`} type="number" min="1" max="78" value={card.serialNumber ?? ""} onChange={(event) => updateCard(index, { serialNumber: event.target.value ? Number(event.target.value) : null })} /></label></div>
              <div className="open-observation-card-field" role="cell"><label><span className="open-observation-mobile-label">牌卡</span><select aria-label={`第 ${card.position} 張牌卡`} value={card.cardName} onChange={(event) => updateCard(index, { cardName: event.target.value })}><option value="">請選擇牌卡</option>{tarotCardNames.map((name) => <option key={name}>{name}</option>)}</select></label></div>
              <div role="cell"><label><span className="open-observation-mobile-label">正逆位</span><select aria-label={`第 ${card.position} 張正逆位`} value={card.orientation} onChange={(event) => updateCard(index, { orientation: event.target.value as TarotOrientation })}><option value="">請選擇</option><option value="upright">正位</option><option value="reversed">逆位</option></select></label></div>
            </div>)}
          </div>
        </div>
      </section>

      <label className="open-observation-note"><span>觀測備註（選填）</span><textarea value={input.note} onChange={(event) => setInput((current) => ({ ...current, note: event.target.value }))} placeholder="備註只作為觀測補充，不會被視為題目。" /></label>
      <div className="open-observation-footer-actions"><a className="ghost-button button-link" href="#/records">取消</a><button className="primary-button" type="button" disabled={saving || errors.length > 0 || !online} onClick={() => void save()}>{saving ? "正在儲存觀測…" : "儲存觀測"}</button></div>
      {errors.length ? <small className="draw-disabled-reason open-observation-save-reason">{errors[0]}</small> : null}
    </section>
  </main>;
}
