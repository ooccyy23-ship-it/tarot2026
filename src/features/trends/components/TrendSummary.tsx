import { TREND_CONSTRUCT_BY_ID } from "../constants/constructTaxonomy";
import { formatPp } from "../logic/trendAnalysis";
import type { TrendSummary as TrendSummaryData } from "../types/trendAnalysis";

function labels(ids: Array<keyof typeof TREND_CONSTRUCT_BY_ID>): string {
  return ids.map((id) => TREND_CONSTRUCT_BY_ID[id].label).join(" / ");
}

export function TrendSummary({ summary }: { summary: TrendSummaryData }) {
  return (
    <section className="trend-summary-grid" aria-label="趨勢摘要">
      <article><span>本期主要構念</span><strong>{summary.currentTop ? labels(summary.currentTop.ids) : "—"}</strong><small>{summary.currentTop ? `${summary.currentTop.share.toFixed(1)}%` : "資料不足"}</small></article>
      <article><span>較前期變化</span><strong>{formatPp(summary.currentTopChange)}</strong><small>{summary.currentTopChange === null ? "資料不足" : summary.currentTopChange >= 3 ? "上升" : summary.currentTopChange <= -3 ? "下降" : "持平"}</small></article>
      <article><span>持續上升</span><strong>{summary.sustainedRise ? labels(summary.sustainedRise.ids) : "—"}</strong><small>{summary.sustainedRise ? `連續 ${summary.sustainedRise.periods} 期上升` : "資料不足"}</small></article>
      <article><span>明顯下降</span><strong>{summary.largestDrop ? labels(summary.largestDrop.ids) : "—"}</strong><small>{summary.largestDrop ? formatPp(summary.largestDrop.changePp) : "資料不足"}</small></article>
    </section>
  );
}
