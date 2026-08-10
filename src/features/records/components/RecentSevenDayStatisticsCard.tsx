import { useMemo } from "react";
import { buildRecentDailySummary, formatShortDate } from "../logic/tarotRecordDailyStatistics";
import type { ParsedTarotRecord } from "../types/tarotRecord";

export function RecentSevenDayStatisticsCard({ records }: { records: ParsedTarotRecord[] }) {
  const summary = useMemo(() => buildRecentDailySummary(records), [records]);
  const maxCount = Math.max(summary.highestCount, 1);

  return (
    <article className="records-chart-card records-chart-full records-daily-seven-card">
      <header>
        <div>
          <h3>近 7 日抽牌統計</h3>
          <span>今天與往前 6 個日曆日</span>
        </div>
        <a className="secondary-button button-link compact-button" href="#/analytics/daily">查看完整統計</a>
      </header>

      <div className="records-daily-summary">
        <div><span>近 7 日總計</span><strong>{summary.totalCount}</strong><small>張</small></div>
        <div><span>日均抽牌</span><strong>{summary.dailyAverage.toFixed(1)}</strong><small>張</small></div>
        <div>
          <span>最高單日</span>
          <strong>{summary.highestCount}</strong>
          <small>{summary.highestDate ? `張 · ${formatShortDate(summary.highestDate)}` : "尚無資料"}</small>
        </div>
      </div>

      <div
        className="records-daily-chart"
        role="img"
        aria-label={`近 7 日每日抽牌張數：${summary.days.map((day) => `${day.label} ${day.count} 張`).join("，")}`}
      >
        <span className="records-daily-y-label">張數</span>
        <div className="records-daily-columns">
          {summary.days.map((day) => (
            <div className="records-daily-column" key={day.date}>
              <strong>{day.count}</strong>
              <div className="records-daily-bar-track">
                <i
                  className={day.count === 0 ? "is-zero" : ""}
                  style={{ height: day.count === 0 ? 0 : `${Math.max((day.count / maxCount) * 100, 5)}%` }}
                />
              </div>
              <span>{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
