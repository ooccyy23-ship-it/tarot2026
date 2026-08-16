import { useMemo } from "react";
import { calculateTarotRecordStatistics } from "../logic/tarotRecordStatistics";
import type { ParsedTarotRecord } from "../types/tarotRecord";

function formatRate(part: number, total: number): string {
  return total === 0 ? "0.00%" : `${((part / total) * 100).toFixed(2)}%`;
}

export function TarotObservationTypeComparison({ records }: { records: ParsedTarotRecord[] }) {
  const comparison = useMemo(() => {
    const questioned = records.filter((record) => (record.recordType ?? "questioned") === "questioned");
    const open = records.filter((record) => record.recordType === "open_observation");
    const questionedStats = calculateTarotRecordStatistics(questioned);
    const openStats = calculateTarotRecordStatistics(open);
    return {
      questioned,
      open,
      questionedStats,
      openStats,
      rows: questionedStats.frequencies
        .map((row, index) => ({ questioned: row, open: openStats.frequencies[index] }))
        .filter(({ questioned: left, open: right }) => left.totalCount > 0 || right.totalCount > 0),
    };
  }, [records]);

  return (
    <section className="panel observation-type-comparison" aria-labelledby="observation-type-comparison-title">
      <div className="section-heading">
        <div><p className="eyebrow">Source Comparison</p><h2 id="observation-type-comparison-title">觀測類型比較</h2><p>以各類型總牌數為分母比較出現率，避免樣本數不同造成誤判。</p></div>
      </div>
      <div className="observation-type-comparison-summary">
        <article><span>題組觀測</span><strong>{comparison.questioned.length} 張</strong><small>正位 {formatRate(comparison.questionedStats.uprightCount, comparison.questioned.length)} · 逆位 {formatRate(comparison.questionedStats.reversedCount, comparison.questioned.length)}</small></article>
        <article><span>無題觀測</span><strong>{comparison.open.length} 張</strong><small>正位 {formatRate(comparison.openStats.uprightCount, comparison.open.length)} · 逆位 {formatRate(comparison.openStats.reversedCount, comparison.open.length)}</small></article>
      </div>
      {comparison.rows.length === 0 ? <p className="records-placeholder">尚無可比較的正式紀錄。</p> : <div className="records-frequency-table-wrap"><table className="records-frequency-table observation-type-comparison-table"><thead><tr><th>牌卡</th><th>題組觀測</th><th>出現率</th><th>正／逆位率</th><th>無題觀測</th><th>出現率</th><th>正／逆位率</th></tr></thead><tbody>{comparison.rows.map(({ questioned, open }) => <tr key={questioned.cardName}><td><strong>{questioned.cardName}</strong></td><td>{questioned.totalCount} / {comparison.questioned.length}</td><td>{formatRate(questioned.totalCount, comparison.questioned.length)}</td><td>{formatRate(questioned.uprightCount, questioned.totalCount)} / {formatRate(questioned.reversedCount, questioned.totalCount)}</td><td>{open.totalCount} / {comparison.open.length}</td><td>{formatRate(open.totalCount, comparison.open.length)}</td><td>{formatRate(open.uprightCount, open.totalCount)} / {formatRate(open.reversedCount, open.totalCount)}</td></tr>)}</tbody></table></div>}
    </section>
  );
}
