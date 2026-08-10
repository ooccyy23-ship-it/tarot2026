import { Fragment, useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import {
  calculateDailyTarotStatistics,
  filterDailyStatisticsByRange,
  formatDailyDate,
  type DailyStatisticsRange,
} from "../features/records/logic/tarotRecordDailyStatistics";
import { tarotRecordStorageErrorMessage } from "../features/records/storage/tarotRecordError";
import { getTarotRecordService } from "../features/records/storage/tarotRecordService";
import type { ParsedTarotRecord } from "../features/records/types/tarotRecord";

const ranges: Array<{ value: DailyStatisticsRange; label: string }> = [
  { value: "7", label: "7 日" },
  { value: "30", label: "30 日" },
  { value: "all", label: "全部" },
];

export function DailyTarotStatisticsPage() {
  const [records, setRecords] = useState<ParsedTarotRecord[]>([]);
  const [range, setRange] = useState<DailyStatisticsRange>("30");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTarotRecordService().listRecords()
      .then(setRecords)
      .catch((reason) => setError(tarotRecordStorageErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  const allStatistics = useMemo(() => calculateDailyTarotStatistics(records), [records]);
  const statistics = useMemo(
    () => filterDailyStatisticsByRange(allStatistics, range),
    [allStatistics, range],
  );

  const toggleDate = (date: string) => {
    setExpandedDates((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <main className="content-page records-page records-daily-page">
      <PageHeader
        eyebrow="Daily Statistics"
        title="每日抽牌統計"
        description="由既有抽牌紀錄即時計算每日牌數、題組數、正逆位及大／小阿爾克那分布。"
        actions={<a className="secondary-button button-link" href="#/analytics">返回統計分析</a>}
      />

      <section className="panel records-daily-detail-panel">
        <div className="records-daily-detail-heading">
          <div>
            <p className="eyebrow">Date Range</p>
            <h2>每日統計明細</h2>
          </div>
          <div className="records-daily-range" role="group" aria-label="統計時間範圍">
            {ranges.map((item) => (
              <button
                className={range === item.value ? "is-active" : ""}
                type="button"
                key={item.value}
                aria-pressed={range === item.value}
                onClick={() => { setRange(item.value); setExpandedDates(new Set()); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="status-message error" role="alert">{error}</p> : null}
        {loading ? <div className="records-placeholder" aria-live="polite"><strong>正在載入每日統計…</strong></div> : null}
        {!loading && !error && statistics.length === 0 ? (
          <EmptyState title="尚無每日抽牌紀錄" description="目前選擇的日期範圍內沒有已儲存的抽牌紀錄。" />
        ) : null}

        {!loading && !error && statistics.length > 0 ? (
          <div className="records-daily-table-wrap">
            <table className="records-daily-table">
              <thead><tr><th>日期</th><th>抽牌數</th><th>題組數</th><th>正位</th><th>逆位</th><th>大阿爾克那</th><th>小阿爾克那</th></tr></thead>
              <tbody>
                {statistics.map((day) => {
                  const expanded = expandedDates.has(day.date);
                  return (
                    <Fragment key={day.date}>
                      <tr className={`records-daily-data-row ${expanded ? "is-expanded" : ""}`} onClick={() => toggleDate(day.date)}>
                        <td>
                          <button className="records-daily-date-button" type="button" onClick={(event) => { event.stopPropagation(); toggleDate(day.date); }} aria-expanded={expanded}>
                            <span aria-hidden="true">{expanded ? "−" : "+"}</span>{formatDailyDate(day.date)}
                          </button>
                        </td>
                        <td>{day.totalCount}</td><td>{day.groupCount}</td><td>{day.uprightCount}</td><td>{day.reversedCount}</td><td>{day.majorCount}</td><td>{day.minorCount}</td>
                      </tr>
                      {expanded ? (
                        <tr className="records-daily-expanded-row">
                          <td colSpan={7}>
                            <div className="records-daily-expanded-content">
                              <section className="records-daily-high-frequency" aria-label={`${formatDailyDate(day.date)} 當日高頻牌`}>
                                <strong>當日高頻牌</strong>
                                <div>
                                  {day.highFrequencyCards.map((card) => (
                                    <span key={card.cardName}>{card.cardName} <b>× {card.count}</b></span>
                                  ))}
                                </div>
                              </section>
                              <div className="records-daily-groups">
                              {day.groups.map((group, groupIndex) => (
                                <article key={group.groupId}>
                                  <header>
                                    <div><span>題組 {groupIndex + 1}</span><h3>{group.groupTitle}</h3></div>
                                    <p>{group.observationTime || "未記錄時間"} · {group.cardCount} 張牌</p>
                                  </header>
                                  <ol>
                                    {group.cards.map((card) => <li key={card.id}>{card.cardName}{card.orientationLabel}</li>)}
                                  </ol>
                                </article>
                              ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
