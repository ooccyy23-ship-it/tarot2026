import { useMemo, useState } from "react";
import { RecentSevenDayStatisticsCard } from "./RecentSevenDayStatisticsCard";
import { createTarotRecordsCsv, tarotRecordsCsvFilename } from "../logic/tarotRecordCsv";
import { sortTarotRecordsNewest } from "../logic/tarotRecordCollection";
import {
  calculateTarotRecordStatistics,
  sortTarotCardFrequencies,
  type TarotFrequencySortKey,
} from "../logic/tarotRecordStatistics";
import type { ParsedTarotRecord, TarotSuit } from "../types/tarotRecord";
import { buildRecordsHash } from "../logic/tarotRecordNavigation";

const arcanaLabels = { major: "大阿爾克那", minor: "小阿爾克那" } as const;
const suitLabels: Record<TarotSuit, string> = {
  major: "大阿爾克那",
  cups: "聖杯",
  swords: "寶劍",
  wands: "權杖",
  pentacles: "星幣",
};
const FREQUENCY_PAGE_SIZE = 15;
type FrequencyScope = "recorded" | "all" | "missing";

function formatPercentage(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatPercentagePoint(value: number): string {
  const normalized = Math.abs(value) < 0.05 ? 0 : value;
  return `${normalized > 0 ? "+" : ""}${normalized.toFixed(1)}pp`;
}

function downloadRecords(records: ParsedTarotRecord[]): void {
  const blob = new Blob([createTarotRecordsCsv(sortTarotRecordsNewest(records))], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = tarotRecordsCsvFilename();
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function TarotRecordStatisticsSection({ records }: { records: ParsedTarotRecord[] }) {
  const [frequencySearch, setFrequencySearch] = useState("");
  const [sortKey, setSortKey] = useState<TarotFrequencySortKey>("order");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [frequencyScope, setFrequencyScope] = useState<FrequencyScope>("recorded");
  const [frequencyPage, setFrequencyPage] = useState(1);
  const [exportMessage, setExportMessage] = useState("");
  const statistics = useMemo(() => calculateTarotRecordStatistics(records), [records]);
  const filteredFrequencies = useMemo(() => {
    const keyword = frequencySearch.trim().toLocaleLowerCase("zh-Hant");
    return sortTarotCardFrequencies(
      statistics.frequencies.filter((row) => {
        const matchesScope = frequencyScope === "all"
          || (frequencyScope === "recorded" && row.totalCount > 0)
          || (frequencyScope === "missing" && row.totalCount === 0);
        return matchesScope && (!keyword || row.cardName.toLocaleLowerCase("zh-Hant").includes(keyword));
      }),
      sortKey,
      sortDirection,
    );
  }, [frequencyScope, frequencySearch, sortDirection, sortKey, statistics.frequencies]);
  const frequencyPageCount = Math.max(1, Math.ceil(filteredFrequencies.length / FREQUENCY_PAGE_SIZE));
  const currentFrequencyPage = Math.min(frequencyPage, frequencyPageCount);
  const pagedFrequencies = filteredFrequencies.slice(
    (currentFrequencyPage - 1) * FREQUENCY_PAGE_SIZE,
    currentFrequencyPage * FREQUENCY_PAGE_SIZE,
  );
  const topTen = statistics.ranking.slice(0, 10);
  const topCount = Math.max(...topTen.map((row) => row.totalCount), 1);
  const orientationDifference = Math.abs(
    statistics.uprightPercentage - statistics.reversedPercentage,
  );

  const exportCsv = () => {
    try {
      downloadRecords(records);
      setExportMessage(`已匯出 ${records.length} 筆資料。`);
      window.setTimeout(() => setExportMessage(""), 1800);
    } catch {
      setExportMessage("CSV 匯出失敗，請確認瀏覽器允許下載檔案。");
    }
  };

  return (
    <section className="panel records-statistics-panel" aria-labelledby="records-statistics-title">
      <div className="section-heading records-statistics-heading">
        <div><p className="eyebrow">Analysis</p><h2 id="records-statistics-title">牌卡出現頻率</h2><p>統計以全部已儲存紀錄計算，正位與逆位合併為同一張牌。</p></div>
        <div className="records-export-actions">
          <button className="secondary-button" type="button" disabled={records.length === 0} onClick={exportCsv}>匯出 CSV</button>
          {exportMessage ? <small role="status">{exportMessage}</small> : null}
        </div>
      </div>

      <div className="records-stat-summary">
        <article><span>全部牌卡</span><strong>{statistics.totalRecords}</strong><small>總筆數</small></article>
        <article><span>不同牌卡</span><strong>{statistics.uniqueCards}</strong><small>共 78 張</small></article>
        <a href={buildRecordsHash({ orientation: "upright" })} aria-label={`查看正位的 ${statistics.uprightCount} 次出現`}><span>正位</span><strong>{statistics.uprightCount}</strong><small>{formatPercentage(statistics.uprightPercentage)} · 查看紀錄</small></a>
        <a href={buildRecordsHash({ orientation: "reversed" })} aria-label={`查看逆位的 ${statistics.reversedCount} 次出現`}><span>逆位</span><strong>{statistics.reversedCount}</strong><small>{formatPercentage(statistics.reversedPercentage)} · 查看紀錄</small></a>
        <a href={buildRecordsHash({ arcanaType: "major" })} aria-label={`查看大阿爾克那的 ${statistics.majorCount} 次出現`}><span>大阿爾克那</span><strong>{statistics.majorCount}</strong><small>{formatPercentage(statistics.majorPercentage)} · 查看紀錄</small></a>
        <a href={buildRecordsHash({ arcanaType: "minor" })} aria-label={`查看小阿爾克那的 ${statistics.minorCount} 次出現`}><span>小阿爾克那</span><strong>{statistics.minorCount}</strong><small>{formatPercentage(statistics.minorPercentage)} · 查看紀錄</small></a>
      </div>

      <div className="records-chart-grid">
        <article className="records-chart-card records-chart-wide records-top-ten-card">
          <header><h3>Top 10 牌卡</h3><span>依總次數排序</span></header>
          {topTen.length === 0 ? <div className="records-chart-empty">尚無牌卡資料</div> : <div className="records-horizontal-bars records-top-ten-bars">
            {[topTen.slice(0, 5), topTen.slice(5)].map((column, columnIndex) => <div className="records-top-ten-column" key={columnIndex}>
              {column.map((row, rowIndex) => <a className="records-bar-row records-stat-drilldown" href={buildRecordsHash({ cardName: row.cardName })} aria-label={`查看${row.cardName}的 ${row.totalCount} 次出現`} key={row.cardName}>
                <span><small>{columnIndex * 5 + rowIndex + 1}</small>{row.cardName}</span>
                <div><i style={{ width: `${(row.totalCount / topCount) * 100}%` }} /></div>
                <strong>{row.totalCount}</strong>
              </a>)}
            </div>)}
          </div>}
        </article>

        <article className="records-chart-card records-chart-wide records-structure-card">
          <header className="records-structure-header">
            <h3>抽牌結構</h3>
            <span>總計 {statistics.totalRecords} 張</span>
          </header>
          <div className="records-structure-layout">
            <section className="records-structure-section records-orientation-section" aria-labelledby="records-orientation-title">
              <h4 id="records-orientation-title">方向分布（正逆位）</h4>
              <div className="records-structure-rows">
                {[
                  { label: "正位", count: statistics.uprightCount, percentage: statistics.uprightPercentage, className: "is-upright" },
                  { label: "逆位", count: statistics.reversedCount, percentage: statistics.reversedPercentage, className: "is-reversed" },
                ].map((item) => <a className="records-structure-row records-stat-drilldown" href={buildRecordsHash({ orientation: item.label === "正位" ? "upright" : "reversed" })} aria-label={`查看${item.label}的 ${item.count} 次出現`} key={item.label}>
                  <div className="records-structure-values">
                    <span>{item.label}</span>
                    <strong>{item.count} 張</strong>
                    <strong>{formatPercentage(item.percentage)}</strong>
                  </div>
                  <progress className={item.className} max="100" value={item.percentage}>{formatPercentage(item.percentage)}</progress>
                </a>)}
              </div>
              <p className="records-orientation-gap">正逆差 <strong>{orientationDifference.toFixed(1)} 個百分點</strong></p>
              <p className="records-structure-note">此項僅呈現抽牌方向分布，不作為情感或事件意義判定。</p>
            </section>

            <section className="records-structure-section records-suit-section" aria-labelledby="records-suit-title">
              <div className="records-structure-subheading">
                <h4 id="records-suit-title">花色分布（小阿爾克那）</h4>
                <span>基準：25%（四花色均勻分布）</span>
              </div>
              <div className="records-structure-rows records-structure-suit-rows">
                {statistics.suitDistribution.map((item) => <a className="records-structure-row records-suit-row records-stat-drilldown" href={buildRecordsHash({ suit: item.suit })} aria-label={`查看${suitLabels[item.suit]}的 ${item.count} 次出現`} key={item.suit}>
                  <div className="records-structure-values">
                    <span>{suitLabels[item.suit]}</span>
                    <strong>{item.count} 張</strong>
                    <strong>{formatPercentage(item.percentage)}</strong>
                    <em className={item.percentage >= 25 ? "is-positive" : "is-negative"}>{formatPercentagePoint(item.percentage - 25)}</em>
                  </div>
                  <progress max="100" value={item.percentage}>{formatPercentage(item.percentage)}</progress>
                </a>)}
              </div>
              <p className="records-structure-note">pp = percentage point（百分點）</p>
            </section>
          </div>
        </article>

        <RecentSevenDayStatisticsCard records={records} />
      </div>

      <div className="records-frequency-section">
        <div className="section-heading"><div><p className="eyebrow">Frequency Detail</p><h3>牌卡頻率明細</h3><p>預設只顯示曾出現的牌；需要時可切換查看全部 78 張或尚未出現的牌。</p></div></div>
        <div className="records-frequency-controls">
          <label><span>資料範圍</span><select value={frequencyScope} onChange={(event) => { setFrequencyScope(event.target.value as FrequencyScope); setFrequencyPage(1); }}><option value="recorded">只看有紀錄</option><option value="all">全部 78 張</option><option value="missing">只看尚未出現</option></select></label>
          <label><span>搜尋牌名</span><input type="search" value={frequencySearch} placeholder="例如：聖杯3" onChange={(event) => { setFrequencySearch(event.target.value); setFrequencyPage(1); }} /></label>
          <label><span>排序欄位</span><select value={sortKey} onChange={(event) => { setSortKey(event.target.value as TarotFrequencySortKey); setFrequencyPage(1); }}><option value="order">牌序</option><option value="totalCount">總次數</option><option value="uprightCount">正位</option><option value="reversedCount">逆位</option><option value="recentDate">最近出現</option></select></label>
          <label><span>排序方向</span><select value={sortDirection} onChange={(event) => { setSortDirection(event.target.value as "asc" | "desc"); setFrequencyPage(1); }}><option value="asc">由小到大</option><option value="desc">由大到小</option></select></label>
        </div>
        {pagedFrequencies.length === 0 ? <div className="records-placeholder records-frequency-empty"><strong>沒有符合條件的牌卡</strong><p>請調整資料範圍或搜尋條件。</p></div> : <>
          <div className="records-frequency-table-wrap"><table className="records-frequency-table records-frequency-complete"><thead><tr><th>牌序</th><th>牌卡</th><th>牌類</th><th>牌組</th><th>總次數</th><th>正位</th><th>逆位</th><th>比例</th><th>最近出現日期</th></tr></thead><tbody>{pagedFrequencies.map((row) => <tr key={row.cardName}><td>{row.order}</td><td>{row.totalCount > 0 ? <a href={buildRecordsHash({ cardName: row.cardName })} aria-label={`查看${row.cardName}的原始紀錄`}><strong>{row.cardName}</strong></a> : <strong>{row.cardName}</strong>}</td><td>{arcanaLabels[row.arcanaType]}</td><td>{suitLabels[row.suit]}</td><td>{row.totalCount}</td><td>{row.uprightCount}</td><td>{row.reversedCount}</td><td>{formatPercentage(row.percentage)}</td><td>{row.recentDate ? row.recentDate.replace(/-/g, "/") : "尚未出現"}</td></tr>)}</tbody></table></div>
          <div className="records-frequency-pagination">
            <span>共 {filteredFrequencies.length} 張 · 第 {currentFrequencyPage}／{frequencyPageCount} 頁</span>
            <div><button className="ghost-button compact-button" type="button" disabled={currentFrequencyPage <= 1} onClick={() => setFrequencyPage((page) => Math.max(1, page - 1))}>上一頁</button><button className="ghost-button compact-button" type="button" disabled={currentFrequencyPage >= frequencyPageCount} onClick={() => setFrequencyPage((page) => Math.min(frequencyPageCount, page + 1))}>下一頁</button></div>
          </div>
        </>}
      </div>
    </section>
  );
}
