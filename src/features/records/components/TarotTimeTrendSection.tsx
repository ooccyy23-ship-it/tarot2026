import { useMemo, useState } from "react";
import { calculateTarotRecordTrend, type TarotTrendSeries } from "../logic/tarotRecordTrend";
import type { ParsedTarotRecord } from "../types/tarotRecord";

const seriesColors = ["#8b5bb7", "#738f45", "#d65a4a", "#d9792b", "#3f82c4"];
const rangeOptions = [14, 30, 60, 90];
const WIDTH_PER_DAY = 22;
const MIN_WIDTH = 760;
const HEIGHT = 340;
const LEFT = 48;
const RIGHT = 24;
const TOP = 24;
const BOTTOM = 52;

function displayDate(value: string): string {
  return value ? value.slice(5).replace("-", "/") : "";
}

function polylinePoints(series: TarotTrendSeries, width: number, maxCount: number): string {
  const chartWidth = width - LEFT - RIGHT;
  const chartHeight = HEIGHT - TOP - BOTTOM;
  return series.points.map((point, index) => {
    const x = series.points.length === 1 ? LEFT + chartWidth / 2 : LEFT + (chartWidth * index) / (series.points.length - 1);
    const y = TOP + chartHeight - (point.count / Math.max(maxCount, 1)) * chartHeight;
    return `${x},${y}`;
  }).join(" ");
}

function xTickIndexes(length: number): number[] {
  if (length < 2) return [0];
  const indexes = Array.from({ length: 6 }, (_, index) => Math.round((index * (length - 1)) / 5));
  return [...new Set(indexes)];
}

export function TarotTimeTrendSection({ records }: { records: ParsedTarotRecord[] }) {
  const [days, setDays] = useState(30);
  const trend = useMemo(() => calculateTarotRecordTrend(records, days, 5), [days, records]);
  const width = Math.max(MIN_WIDTH, trend.days * WIDTH_PER_DAY);
  const chartWidth = width - LEFT - RIGHT;
  const chartHeight = HEIGHT - TOP - BOTTOM;
  const firstSeries = trend.series[0];
  const tickIndexes = xTickIndexes(firstSeries?.points.length ?? 0);
  const ySteps = Math.min(Math.max(trend.maxDailyCount, 1), 4);
  const yTicks = Array.from({ length: ySteps + 1 }, (_, index) => Math.round((index * Math.max(trend.maxDailyCount, 1)) / ySteps));

  return (
    <section className="panel records-time-trend-panel" aria-labelledby="records-time-trend-title">
      <div className="section-heading records-time-trend-heading">
        <div>
          <p className="eyebrow">Time Trend</p>
          <h2 id="records-time-trend-title">牌卡時間趨勢走勢圖</h2>
          <p>以最新觀測日為終點，顯示區間內出現次數最高的 5 張牌每日活動變化；沒有紀錄的日期以 0 次呈現。</p>
        </div>
        <label className="records-time-trend-range">
          <span>觀察期間</span>
          <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
            {rangeOptions.map((value) => <option value={value} key={value}>近 {value} 天</option>)}
          </select>
        </label>
      </div>

      {trend.series.length === 0 ? (
        <div className="records-placeholder">
          <strong>尚無可繪製的時間趨勢</strong>
          <p>儲存含有有效觀測日期的抽牌紀錄後，將在這裡顯示近期牌卡變化。</p>
        </div>
      ) : (
        <>
          <div className="records-time-trend-meta">
            <span><strong>{trend.dateFrom.replace(/-/g, "/")}</strong> 至 <strong>{trend.dateTo.replace(/-/g, "/")}</strong></span>
            <span>{trend.totalGroups} 組紀錄 · {trend.totalRecords} 張牌</span>
          </div>
          <div className="records-time-trend-legend" aria-label="趨勢線圖例">
            {trend.series.map((series, index) => <span key={series.cardName}><i style={{ background: seriesColors[index] }} />{series.cardName}<small>{series.totalCount} 次</small></span>)}
          </div>
          <div className="records-time-trend-scroll">
            <svg className="records-time-trend-chart" viewBox={`0 0 ${width} ${HEIGHT}`} style={{ minWidth: width }} role="img" aria-labelledby="records-time-trend-svg-title records-time-trend-svg-description">
              <title id="records-time-trend-svg-title">近 {trend.days} 天 Top 5 牌卡時間趨勢</title>
              <desc id="records-time-trend-svg-description">橫軸為日期，縱軸為各牌卡每日出現次數。</desc>
              {yTicks.map((tick) => {
                const y = TOP + chartHeight - (tick / Math.max(trend.maxDailyCount, 1)) * chartHeight;
                return <g key={tick}>
                  <line className="records-time-trend-grid-line" x1={LEFT} y1={y} x2={width - RIGHT} y2={y} />
                  <text className="records-time-trend-axis-label" x={LEFT - 10} y={y + 4} textAnchor="end">{tick}</text>
                </g>;
              })}
              {tickIndexes.map((index) => {
                const point = firstSeries.points[index];
                const x = firstSeries.points.length === 1 ? LEFT + chartWidth / 2 : LEFT + (chartWidth * index) / (firstSeries.points.length - 1);
                return <text className="records-time-trend-axis-label" x={x} y={HEIGHT - 20} textAnchor="middle" key={point.date}>{displayDate(point.date)}</text>;
              })}
              {trend.series.map((series, seriesIndex) => <g key={series.cardName}>
                <polyline className="records-time-trend-line" points={polylinePoints(series, width, trend.maxDailyCount)} style={{ stroke: seriesColors[seriesIndex] }} />
                {series.points.map((point, pointIndex) => {
                  if (point.count === 0) return null;
                  const x = series.points.length === 1 ? LEFT + chartWidth / 2 : LEFT + (chartWidth * pointIndex) / (series.points.length - 1);
                  const y = TOP + chartHeight - (point.count / Math.max(trend.maxDailyCount, 1)) * chartHeight;
                  return <circle className="records-time-trend-point" cx={x} cy={y} r="4" fill={seriesColors[seriesIndex]} key={point.date}>
                    <title>{series.cardName} · {point.date.replace(/-/g, "/")} · {point.count} 次</title>
                  </circle>;
                })}
              </g>)}
            </svg>
          </div>
          <p className="records-time-trend-footnote">Top 5 依目前選取期間的總出現次數決定；切換期間後，入選牌卡可能改變。</p>
        </>
      )}
    </section>
  );
}
