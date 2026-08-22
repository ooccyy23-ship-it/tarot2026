import { useMemo } from "react";
import { calculateDrawTimeDistribution } from "../logic/tarotRecordTimeDistribution";
import type { ParsedTarotRecord } from "../types/tarotRecord";

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function TarotDrawTimeDistributionCard({ records }: { records: ParsedTarotRecord[] }) {
  const distribution = useMemo(() => calculateDrawTimeDistribution(records), [records]);
  const maximumCount = Math.max(...distribution.hours.map((hour) => hour.count), 1);

  return (
    <article className="records-chart-card records-chart-wide records-draw-time-card" aria-labelledby="records-draw-time-title">
      <header>
        <div><h3 id="records-draw-time-title">抽牌時段分布</h3><p>每個題組或無題觀測計算一次，不以牌卡張數重複計算。</p></div>
        <span>有效觀測 {distribution.validGroupCount} 筆</span>
      </header>

      {distribution.validGroupCount === 0 ? <div className="records-chart-empty">目前篩選範圍內沒有可辨識時間的觀測紀錄</div> : <>
        <div className="records-draw-time-kpis">
          <div><span>最常抽牌時段</span><strong>{distribution.peakPeriod?.label}</strong><small>{distribution.peakPeriod?.rangeLabel} · {distribution.peakPeriod?.count} 次 · {formatPercentage(distribution.peakPeriod?.percentage ?? 0)}</small></div>
          <div><span>高峰小時</span><strong>{distribution.peakHour?.rangeLabel}</strong><small>共 {distribution.peakHour?.count} 次觀測</small></div>
          <div><span>有效觀測</span><strong>{distribution.validGroupCount}</strong><small>依題組／觀測去重</small></div>
        </div>

        <div className="records-draw-periods" aria-label="四大抽牌時段摘要">
          {distribution.periods.map((period) => <div key={period.id}><span>{period.label}</span><strong>{period.count} 次</strong><small>{period.rangeLabel} · {formatPercentage(period.percentage)}</small></div>)}
        </div>

        <div className="records-draw-hourly-heading"><h4>24 小時分布</h4><span>柱高依實際題組／觀測次數呈現</span></div>
        <div className="records-draw-hourly-scroll">
          <div className="records-draw-hourly-chart" role="img" aria-label="0 時到 23 時的抽牌觀測次數直條圖">
            {distribution.hours.map((hour) => <div className="records-draw-hour" title={`${hour.rangeLabel}：${hour.count} 次`} key={hour.hour}>
              <strong>{hour.count || ""}</strong>
              <div><i className={hour.count === 0 ? "is-zero" : ""} style={{ height: `${(hour.count / maximumCount) * 100}%` }} /></div>
              <span>{hour.label}</span>
            </div>)}
          </div>
        </div>
      </>}

      {distribution.invalidGroupCount > 0 ? <p className="records-draw-time-note">另有 {distribution.invalidGroupCount} 筆觀測因時間格式無法辨識，未納入本圖。</p> : null}
    </article>
  );
}
