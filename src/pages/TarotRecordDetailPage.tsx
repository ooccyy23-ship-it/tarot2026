import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { RecordTypeBadge } from "../features/records/components/RecordTypeBadge";
import { formatDateForDisplay } from "../features/records/parser/observationDateTime";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type { ParsedTarotRecord } from "../features/records/types/tarotRecord";

function requestedGroupId(): string {
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query).get("groupId") ?? "";
}

function requestedReturnHash(): string {
  const query = window.location.hash.split("?")[1] ?? "";
  const requested = new URLSearchParams(query).get("return") ?? "";
  return requested.startsWith("#/records") && !requested.startsWith("#/records/detail") ? requested : "#/records";
}

export function TarotRecordDetailPage() {
  const groupId = useMemo(requestedGroupId, []);
  const returnHash = useMemo(requestedReturnHash, []);
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void getTarotRecordService().listRecordsByGroup(groupId).then((items) => {
      if (active) {
        const sorted = items.sort((a, b) => a.questionOrder - b.questionOrder);
        setRecords(sorted);
        setNote(sorted[0]?.note ?? "");
      }
    }).catch((reason) => { if (active) setError(tarotRecordStorageErrorMessage(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [groupId]);

  const first = records[0];
  const isOpenObservation = first?.recordType === "open_observation";
  const saveNote = async () => {
    if (!first || !isOpenObservation || savingNote) return;
    setSavingNote(true);
    setError("");
    try {
      await getTarotRecordService().updateOpenObservationNote(first.groupId, note);
      setRecords((current) => current.map((record) => ({ ...record, note: note.trim() })));
      setNote(note.trim());
      setNotice("觀測備註已更新。");
    } catch (reason) {
      setError(tarotRecordStorageErrorMessage(reason));
    } finally {
      setSavingNote(false);
    }
  };
  return <main className="content-page records-page records-detail-page">
    <PageHeader eyebrow="Record Detail" title="抽牌紀錄詳情" description="查看已儲存且來源可追溯的完整五張牌結果。" actions={<a className="secondary-button button-link" href={returnHash}>返回原篩選結果</a>} />
    {error ? <p className="status-message error" role="alert">{error}</p> : null}
    {notice ? <p className="status-message success" role="status">{notice}</p> : null}
    {loading ? <section className="panel"><p>正在讀取紀錄…</p></section> : !first ? <section className="panel records-placeholder"><strong>找不到這筆觀測紀錄</strong><p>該紀錄可能已被刪除，或網址中的觀測編號不正確。</p></section> : <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">{isOpenObservation ? first.observationCode ?? first.groupId : first.groupId}</p><h2>{isOpenObservation ? "無題隨機觀測" : first.groupTitle}</h2><p>{formatDateForDisplay(first.observationDate)}　{first.observationTime}{first.weekdayLabel ? `　${first.weekdayLabel}` : ""}</p>{isOpenObservation && first.drawMethod ? <p>抽牌方式：{first.drawMethod}</p> : null}</div><div className="records-detail-heading-meta"><RecordTypeBadge recordType={first.recordType} /><span className="status-chip verified">{records.length} 張牌</span></div></div>
      <div className={`records-detail-list ${isOpenObservation ? "open-observation-detail-list" : ""}`}>{records.map((record) => <article key={record.id}><span>{isOpenObservation ? `位置 ${String(record.position ?? record.questionOrder).padStart(2, "0")}` : `第 ${record.questionOrder} 題`}</span>{isOpenObservation ? null : <strong>{record.questionText}</strong>}<p>{record.sequence ? `序號 ${String(record.sequence).padStart(2, "0")}｜` : ""}{record.cardName}{record.orientationLabel}</p></article>)}</div>
      {isOpenObservation ? <div className="open-observation-note-editor"><label htmlFor="open-observation-note"><span>觀測備註</span><textarea id="open-observation-note" value={note} placeholder="選填；備註不會被視為題目或納入題目分析。" onChange={(event) => { setNote(event.target.value); setNotice(""); }} /></label><button className="secondary-button" type="button" disabled={savingNote || note.trim() === (first.note ?? "")} onClick={() => void saveNote()}>{savingNote ? "正在儲存…" : "儲存備註"}</button><p className="field-hint">無題觀測建立後不能補題，也不能轉換成題組觀測。</p></div> : null}
    </section>}
  </main>;
}
