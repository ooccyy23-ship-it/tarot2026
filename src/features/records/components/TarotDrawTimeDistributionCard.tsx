import { useMemo } from "react";
import { calculateDrawTimeDistribution } from "../logic/tarotRecordTimeDistribution";
import type { ParsedTarotRecord } from "../types/tarotRecord";

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function TarotDrawTimeDistributionCard({ records }: { records: ParsedTarotRecord[] }) {
  const distribution = useMemo(() => calculateDrawTimeDistribution(records), [records]);
  const peakHourCount = distribution.peakHour?.count ?? 0;
  const peakPeriodCount = distribution.peakPeriod?.count ?? 0;
  const maximumCount = Math.max(peakHourCount, 1);
  const peakHours = distribution.hours.filter((hour) => peakHourCount > 0 && hour.count === peakHourCount);
  const peakPeriods = distribution.periods.filter((period) => peakPeriodCount > 0 && period.count === peakPeriodCount);
  const peakHourLabel = peakHours.map((hour) => `${hour.label}:00`).join("、");
  const peakPeriodLabel = peakPeriods.map((period) => period.label).join("、");

  return (
    <article className="records-chart-card records-chart-wide records-draw-time-card" aria-labelledby="records-draw-time-title">
      <header>
        <div><h3 id="records-draw-time-title">抽牌時段分布</h3><p>每個題組或無題觀測計算一次，不以牌卡張數重複計算。</p></div>
        <span>有效觀測 {distribution.validGroupCount} 筆</span>
      </header>

      {distribution.validGroupCount === 0 ? <div className="records-chart-empty">目前篩選範圍內沒有可辨識時間的觀測紀錄</div> : <>
        <div className="records-draw-time-kpis">
          <div className="is-focus"><span>高峰小時</span><strong>{peakHourLabel}</strong><small>{peakHours.length > 1 ? `${peakHours.length} 個並列高峰 · 每個 ${peakHourCount} 次觀測` : `${distribution.peakHour?.rangeLabel} · 共 ${peakHourCount} 次觀測`}</small></div>
          <div><span>最常抽牌時段</span><strong>{peakPeriodLabel}</strong><small>{peakPeriods.length > 1 ? `${peakPeriods.length} 個並列最高 · 每個 ${peakPeriodCount} 次` : `${distribution.peakPeriod?.rangeLabel} · ${peakPeriodCount} 次 · ${formatPercentage(distribution.peakPeriod?.percentage ?? 0)}`}</small></div>
          <div><span>有效觀測</span><strong>{distribution.validGroupCount}</strong><small>依題組／觀測去重</small></div>
        </div>

        <div className="records-draw-periods" aria-label="四大抽牌時段摘要">
          {distribution.periods.map((period) => {
            const isPeak = peakPeriodCount > 0 && period.count === peakPeriodCount;
            return <div className={isPeak ? "is-peak" : ""} key={period.id}><span>{period.label}{isPeak ? <em>最高</em> : null}</span><strong>{period.count} 次</strong><small>{period.rangeLabel} · {formatPercentage(period.percentage)}</small></div>;
          })}
        </div>

        <div className="records-draw-hourly-heading"><h4>24 小時分布</h4><span>柱高依實際題組／觀測次數呈現</span></div>
        <div className="records-draw-hourly-scroll">
          <div className="records-draw-hourly-chart" role="img" aria-label="0 時到 23 時的抽牌觀測次數直條圖">
            {distribution.hours.map((hour) => {
              const isPeak = peakHourCount > 0 && hour.count === peakHourCount;
              return <div className={`records-draw-hour${isPeak ? " is-peak" : ""}`} title={`${hour.rangeLabel}：${hour.count} 次${isPeak ? "（最高）" : ""}`} key={hour.hour}>
              <strong>{isPeak ? <span className="visually-hidden">最高峰：</span> : null}{hour.count || ""}</strong>
              <div><i className={hour.count === 0 ? "is-zero" : ""} style={{ height: `${(hour.count / maximumCount) * 100}%` }} /></div>
              <span>{hour.hour % 2 === 0 ? hour.label : ""}</span>
            </div>;
            })}
          </div>
        </div>
      </>}

      {distribution.invalidGroupCount > 0 ? <p className="records-draw-time-note">另有 {distribution.invalidGroupCount} 筆觀測因時間格式無法辨識，未納入本圖。</p> : null}
    </article>
  );
}
