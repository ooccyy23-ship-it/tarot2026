import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { TarotAnalysisFilterToolbar } from "../features/records/components/TarotAnalysisFilterToolbar";
import { useTarotAnalysisRecords } from "../features/records/hooks/useTarotAnalysisRecords";
import { TREND_CONSTRUCT_IDS } from "../features/trends/constants/constructTaxonomy";
import { ConstructTimeline } from "../features/trends/components/ConstructTimeline";
import { TrendDrilldown } from "../features/trends/components/TrendDrilldown";
import { TrendPeriodTable } from "../features/trends/components/TrendPeriodTable";
import { TrendSummary } from "../features/trends/components/TrendSummary";
import { CALENDAR_WEEK_MONDAY_STRATEGY, calculateTrendAnalysis } from "../features/trends/logic/trendAnalysis";
import type { TrendConstructId, TrendPeriod } from "../features/trends/types/trendAnalysis";

export function TarotTrendAnalysisPage() {
  const analysis = useTarotAnalysisRecords();
  const trend = useMemo(() => calculateTrendAnalysis(analysis.filteredRecords, analysis.effectiveDateFrom, analysis.effectiveDateTo), [analysis.effectiveDateFrom, analysis.effectiveDateTo, analysis.filteredRecords]);
  const defaultSelection = useMemo(() => {
    const totals = TREND_CONSTRUCT_IDS.map((id) => ({ id, count: trend.periods.reduce((sum, period) => sum + period.constructMetrics[id].count, 0) }));
    return totals.filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 3).map((item) => item.id);
  }, [trend.periods]);
  const [selected, setSelected] = useState<TrendConstructId[]>([]);
  const [drilldown, setDrilldown] = useState<{ period: TrendPeriod; constructId: TrendConstructId } | null>(null);

  const defaultSelectionKey = defaultSelection.join("|");
  useEffect(() => { setSelected(defaultSelection); }, [defaultSelectionKey]);
  useEffect(() => { setDrilldown(null); }, [analysis.effectiveDateFrom, analysis.effectiveDateTo, analysis.recordType]);

  return (
    <main className="content-page records-page records-analysis-page trend-analysis-page">
      <PageHeader eyebrow="Trend Analysis" title="趨勢分析" description="以固定七日週期觀察研究構念占比的時間變化，並保留從構念、牌卡到原始紀錄的追溯鏈。" />
      {analysis.error ? <p className="status-message error" role="alert">{analysis.error}</p> : null}
      {analysis.loading ? <section className="panel records-placeholder"><strong>正在載入趨勢資料…</strong></section> : analysis.error ? null : analysis.records.length === 0 ? <section className="panel"><EmptyState title="尚無可分析的資料" description="先儲存正式抽牌紀錄，即可建立七日趨勢分析。" action={<a className="primary-button button-link" href="#/import">前往紀錄匯入</a>} /></section> : <>
        <TarotAnalysisFilterToolbar dateFrom={analysis.effectiveDateFrom} dateTo={analysis.effectiveDateTo} minimumDate={analysis.sourceScope.dateFrom} maximumDate={analysis.sourceScope.dateTo} cardCount={analysis.filteredScope.cardCount} groupCount={analysis.filteredScope.groupCount} recordType={analysis.recordType} onDateFromChange={analysis.updateDateFrom} onDateToChange={analysis.updateDateTo} onRecordTypeChange={analysis.updateRecordType} onReset={analysis.resetFilters} />
        <section className="trend-method-note" aria-label="趨勢分析方法與映射覆蓋率"><span>週期策略：{CALENDAR_WEEK_MONDAY_STRATEGY.label}</span><span>映射覆蓋：{trend.coverage.mappedCatalogCards} / 78 張牌</span><span>目前資料：{trend.coverage.mappedRecordCards} 張有效構念牌，{trend.coverage.unassignedRecordCards} 張未分配</span></section>
        {trend.coverage.unassignedCatalogCards > 0 ? <p className="status-message warning" role="status">目前缺少完整 N Model 牌義資料；{trend.coverage.unassignedCatalogCards} 張牌保留為 UNASSIGNED，不納入構念占比分母。</p> : null}
        <TrendSummary summary={trend.summary} />
        {selected.length ? <ConstructTimeline periods={trend.periods} selected={selected} onSelectedChange={setSelected} onInspect={(period, constructId) => setDrilldown({ period, constructId })} /> : <section className="panel records-placeholder"><strong>目前沒有可繪製的已映射構念</strong><p>補齊經確認的 N Model 映射後，時間線會自動出現。</p></section>}
        <TrendPeriodTable periods={trend.periods} onInspect={(period, constructId) => setDrilldown({ period, constructId })} />
        {drilldown ? <TrendDrilldown {...drilldown} onClose={() => setDrilldown(null)} /> : <section className="panel trend-drilldown-empty"><p className="eyebrow">Research Trace</p><h2>研究追溯</h2><p>點擊時間線資料點或週期表的 Top 構念，查看形成該結果的牌卡與原始紀錄。</p></section>}
      </>}
    </main>
  );
}
