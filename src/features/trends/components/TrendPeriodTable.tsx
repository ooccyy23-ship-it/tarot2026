import { TREND_CONSTRUCT_BY_ID } from "../constants/constructTaxonomy";
import { formatPp, formatTrendPeriod } from "../logic/trendAnalysis";
import type { TrendConstructId, TrendPeriod } from "../types/trendAnalysis";

const directionLabels = { BASELINE: "基準", NEW: "新出現", UP: "上升", DOWN: "下降", STABLE: "持平", NO_DATA: "無有效資料" } as const;
const labels = (ids: TrendConstructId[]) => ids.length ? ids.map((id) => TREND_CONSTRUCT_BY_ID[id].label).join(" / ") : "—";

export function TrendPeriodTable({ periods, onInspect }: { periods: TrendPeriod[]; onInspect: (period: TrendPeriod, constructId: TrendConstructId) => void }) {
  return (
    <section className="panel trend-period-panel" aria-labelledby="trend-period-title">
      <div className="section-heading"><p className="eyebrow">Period Comparison</p><h2 id="trend-period-title">週期比較表</h2></div>
      <div className="trend-table-wrap"><table className="trend-period-table"><thead><tr><th>週期</th><th>牌數</th><th>題組</th><th>Top 構念</th><th>次要構念</th><th>Top 占比</th><th>相較前期</th><th>趨勢</th></tr></thead><tbody>
        {periods.map((period) => {
          const topId = period.topConstructs[0];
          const topMetric = topId ? period.constructMetrics[topId] : null;
          return <tr key={period.id}><td>{formatTrendPeriod(period)}</td><td>{period.totalCards}</td><td>{period.totalQuestionGroups}</td><td>{topId ? <button className="trend-table-link" type="button" onClick={() => onInspect(period, topId)}>{labels(period.topConstructs)}</button> : "—"}</td><td>{labels(period.secondaryConstructs)}</td><td>{topMetric?.share === null || topMetric?.share === undefined ? "—" : `${topMetric.share.toFixed(1)}%`}</td><td>{formatPp(topMetric?.changePp ?? null)}</td><td><span className={`trend-direction is-${(topMetric?.direction ?? "NO_DATA").toLowerCase()}`}>{directionLabels[topMetric?.direction ?? "NO_DATA"]}</span></td></tr>;
        })}
      </tbody></table></div>
    </section>
  );
}
