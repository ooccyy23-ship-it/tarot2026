import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { formatDateForDisplay } from "../features/records/parser/observationDateTime";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type { ParsedTarotRecord } from "../features/records/types/tarotRecord";

function requestedGroupId(): string {
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query).get("groupId") ?? "";
}

export function TarotRecordDetailPage() {
  const groupId = useMemo(requestedGroupId, []);
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getTarotRecordService().listRecords().then((items) => {
      if (active) setRecords(items.filter((item) => item.groupId === groupId).sort((a, b) => a.questionOrder - b.questionOrder));
    }).catch((reason) => { if (active) setError(tarotRecordStorageErrorMessage(reason)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [groupId]);

  const first = records[0];
  return <main className="content-page records-page records-detail-page">
    <PageHeader eyebrow="Record Detail" title="抽牌紀錄詳情" description="查看剛儲存的完整五題抽牌結果。" actions={<a className="secondary-button button-link" href="#/records">返回抽牌資料庫</a>} />
    {error ? <p className="status-message error" role="alert">{error}</p> : null}
    {loading ? <section className="panel"><p>正在讀取紀錄…</p></section> : !first ? <section className="panel records-placeholder"><strong>找不到這筆題組紀錄</strong><p>該紀錄可能已被刪除，或網址中的題組編號不正確。</p></section> : <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">{first.groupId}</p><h2>{first.groupTitle}</h2><p>{formatDateForDisplay(first.observationDate)}　{first.observationTime}</p></div><span className="status-chip verified">{records.length} 筆</span></div>
      <div className="records-detail-list">{records.map((record) => <article key={record.id}><span>第 {record.questionOrder} 題</span><strong>{record.questionText}</strong><p>{record.sequence ? `序號 ${String(record.sequence).padStart(2, "0")}｜` : ""}{record.cardName}{record.orientationLabel}</p></article>)}</div>
    </section>}
  </main>;
}
