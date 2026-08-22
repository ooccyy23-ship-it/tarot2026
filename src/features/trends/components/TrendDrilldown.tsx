import { TREND_CONSTRUCT_BY_ID } from "../constants/constructTaxonomy";
import { formatTrendPeriod, getTrendCardDetails } from "../logic/trendAnalysis";
import { buildRecordsHash } from "../../records/logic/tarotRecordNavigation";
import type { TrendConstructId, TrendPeriod } from "../types/trendAnalysis";

export function TrendDrilldown({ period, constructId, onClose }: { period: TrendPeriod; constructId: TrendConstructId; onClose: () => void }) {
  const details = getTrendCardDetails(period, constructId);
  return (
    <section className="panel trend-drilldown-panel" aria-labelledby="trend-drilldown-title">
      <div className="trend-drilldown-heading"><div><p className="eyebrow">Research Trace</p><h2 id="trend-drilldown-title">{formatTrendPeriod(period)} · {TREND_CONSTRUCT_BY_ID[constructId].label}</h2><p>此構念由下列牌卡形成；點擊牌名可回到原始正式紀錄。</p></div><button className="ghost-button compact-button" type="button" onClick={onClose}>關閉</button></div>
      {details.length === 0 ? <p className="records-placeholder">此期間沒有屬於該構念的牌卡。</p> : <div className="trend-table-wrap"><table className="trend-period-table"><thead><tr><th>牌卡</th><th>出現次數</th><th>占此構念比例</th><th>涉及題組數</th></tr></thead><tbody>{details.map((detail) => <tr key={detail.cardId}><td><a href={buildRecordsHash({ dateFrom: period.periodStart, dateTo: period.periodEnd, cardName: detail.cardName })}>{detail.cardName}</a></td><td>{detail.count}</td><td>{detail.constructShare.toFixed(1)}%</td><td>{detail.groupCount}</td></tr>)}</tbody></table></div>}
    </section>
  );
}
