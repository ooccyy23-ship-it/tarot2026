import { TREND_CONSTRUCT_BY_ID, TREND_CONSTRUCTS } from "../constants/constructTaxonomy";
import { formatPp, formatTrendPeriod } from "../logic/trendAnalysis";
import type { TrendConstructId, TrendPeriod } from "../types/trendAnalysis";

const WIDTH = 900;
const HEIGHT = 320;
const LEFT = 54;
const RIGHT = 24;
const TOP = 24;
const BOTTOM = 56;

function points(periods: TrendPeriod[], constructId: TrendConstructId): string {
  const chartWidth = WIDTH - LEFT - RIGHT;
  const chartHeight = HEIGHT - TOP - BOTTOM;
  return periods.map((period, index) => {
    const x = periods.length === 1 ? LEFT + chartWidth / 2 : LEFT + chartWidth * index / (periods.length - 1);
    const share = period.constructMetrics[constructId].share ?? 0;
    return `${x},${TOP + chartHeight - share / 100 * chartHeight}`;
  }).join(" ");
}

export function ConstructTimeline({ periods, selected, onSelectedChange, onInspect }: {
  periods: TrendPeriod[];
  selected: TrendConstructId[];
  onSelectedChange: (next: TrendConstructId[]) => void;
  onInspect: (period: TrendPeriod, constructId: TrendConstructId) => void;
}) {
  const toggle = (id: TrendConstructId) => {
    if (selected.includes(id)) {
      if (selected.length > 1) onSelectedChange(selected.filter((item) => item !== id));
    } else if (selected.length < 5) onSelectedChange([...selected, id]);
  };
  const chartWidth = WIDTH - LEFT - RIGHT;
  const chartHeight = HEIGHT - TOP - BOTTOM;

  return (
    <section className="panel trend-timeline-panel" aria-labelledby="trend-timeline-title">
      <div className="section-heading"><p className="eyebrow">Construct Timeline</p><h2 id="trend-timeline-title">構念時間線</h2><p>以每期有效構念牌為分母，比較各構念的正規化占比。</p></div>
      <fieldset className="trend-construct-selector"><legend>顯示構念（1–5 個）</legend>{TREND_CONSTRUCTS.map((item) => <label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} disabled={!selected.includes(item.id) && selected.length >= 5} onChange={() => toggle(item.id)} /><i style={{ background: item.color }} />{item.label}</label>)}</fieldset>
      {periods.length === 0 ? <p className="records-placeholder">尚無可繪製的週期資料。</p> : (
        <div className="trend-chart-scroll">
          <svg className="trend-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="trend-chart-title trend-chart-desc">
            <title id="trend-chart-title">七日構念占比時間線</title><desc id="trend-chart-desc">橫軸為固定七日期間，縱軸為有效構念牌中的占比。</desc>
            {[0, 25, 50, 75, 100].map((tick) => { const y = TOP + chartHeight - tick / 100 * chartHeight; return <g key={tick}><line className="trend-grid-line" x1={LEFT} x2={WIDTH - RIGHT} y1={y} y2={y} /><text className="trend-axis-label" x={LEFT - 10} y={y + 4} textAnchor="end">{tick}%</text></g>; })}
            {periods.map((period, index) => { const x = periods.length === 1 ? LEFT + chartWidth / 2 : LEFT + chartWidth * index / (periods.length - 1); return <text className="trend-axis-label" x={x} y={HEIGHT - 18} textAnchor="middle" key={period.id}>{period.periodStart.slice(5).replace("-", "/")}</text>; })}
            {selected.map((id) => <g key={id}>
              <polyline className="trend-line" points={points(periods, id)} style={{ stroke: TREND_CONSTRUCT_BY_ID[id].color }} />
              {periods.map((period, index) => {
                const metric = period.constructMetrics[id];
                if (metric.share === null) return null;
                const x = periods.length === 1 ? LEFT + chartWidth / 2 : LEFT + chartWidth * index / (periods.length - 1);
                const y = TOP + chartHeight - metric.share / 100 * chartHeight;
                const tooltip = `${formatTrendPeriod(period)}\n${TREND_CONSTRUCT_BY_ID[id].label}\n${metric.count} 張\n有效構念牌 ${period.mappedCards} 張\n${metric.share.toFixed(1)}%\n較前期 ${formatPp(metric.changePp)}`;
                return <circle className="trend-point" cx={x} cy={y} r="5" fill={TREND_CONSTRUCT_BY_ID[id].color} key={period.id} role="button" tabIndex={0} aria-label={`${tooltip.replace(/\n/g, "，")}，查看組成牌卡`} onClick={() => onInspect(period, id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onInspect(period, id); }}><title>{tooltip}</title></circle>;
              })}
            </g>)}
          </svg>
        </div>
      )}
    </section>
  );
}
