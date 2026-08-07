import { useMemo, useState } from "react";
import { tarotCardCatalog } from "../../../data/tarotCardCatalog";
import { calculateTarotCardCentrality } from "../logic/tarotRecordCentrality";
import type { ParsedTarotRecord, TarotSuit } from "../types/tarotRecord";

const suitColors: Record<TarotSuit, string> = {
  major: "#8b5bb7",
  wands: "#d9792b",
  cups: "#3f82c4",
  swords: "#47979a",
  pentacles: "#738f45",
};

const cardSuit = new Map(tarotCardCatalog.map((card) => [card.name, card.suit]));

function decimal(value: number): string {
  return value.toFixed(3);
}

export function TarotCentralitySection({ records }: { records: ParsedTarotRecord[] }) {
  const [minimumCount, setMinimumCount] = useState(1);
  const result = useMemo(() => calculateTarotCardCentrality(records, minimumCount), [minimumCount, records]);
  const connectedCards = result.cards.filter((card) => card.degree > 0);
  const displayedCards = connectedCards.slice(0, 10);
  const thresholdOptions = useMemo(() => [...new Set([1, 2, 3, 5, result.maxPairCount])]
    .filter((value) => value === 1 || (value > 0 && value <= result.maxPairCount))
    .sort((left, right) => left - right), [result.maxPairCount]);
  const degreeLeader = connectedCards[0];
  const bridgeLeader = [...connectedCards].sort((left, right) => right.betweenness - left.betweenness || right.degree - left.degree)[0];
  const closenessLeader = [...connectedCards].sort((left, right) => right.closeness - left.closeness || right.degree - left.degree)[0];

  return (
    <section className="panel records-centrality-panel" aria-labelledby="records-centrality-title">
      <div className="section-heading records-centrality-heading">
        <div>
          <p className="eyebrow">Centrality</p>
          <h2 id="records-centrality-title">牌卡中心性分析</h2>
          <p>比較牌卡在共現網絡中的連結數、橋接位置與整體接近程度，辨識目前資料中的結構核心。</p>
        </div>
        <label className="records-network-threshold">
          <span>最低共現次數</span>
          <select value={minimumCount} onChange={(event) => setMinimumCount(Number(event.target.value))}>
            {thresholdOptions.map((value) => <option value={value} key={value}>{value} 次以上</option>)}
          </select>
        </label>
      </div>

      {displayedCards.length < 2 ? (
        <div className="records-placeholder">
          <strong>資料不足，尚無法計算中心性</strong>
          <p>{result.totalCards < 2 ? "至少需要一組包含兩張不同牌卡的紀錄。" : "目前門檻下沒有足夠連線，可降低最低共現次數。"}</p>
        </div>
      ) : (
        <>
          <div className="records-centrality-leaders" aria-label="中心性指標最高牌卡">
            <article><small>最多直接連結</small><strong>{degreeLeader.cardName}</strong><span>{degreeLeader.degree} 張相連牌卡</span></article>
            <article><small>最強橋接位置</small><strong>{bridgeLeader.cardName}</strong><span>中介值 {decimal(bridgeLeader.betweenness)}</span></article>
            <article><small>最接近網絡中心</small><strong>{closenessLeader.cardName}</strong><span>接近值 {decimal(closenessLeader.closeness)}</span></article>
          </div>

          <div className="records-centrality-layout">
            <div className="records-centrality-table-wrap">
              <table className="records-centrality-table">
                <thead>
                  <tr>
                    <th scope="col">排名</th>
                    <th scope="col">牌卡</th>
                    <th scope="col"><span>度中心性</span><small>Degree</small></th>
                    <th scope="col"><span>中介中心性</span><small>Betweenness</small></th>
                    <th scope="col"><span>接近中心性</span><small>Closeness</small></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCards.map((card, index) => {
                    const suit = cardSuit.get(card.cardName) ?? "major";
                    return <tr key={card.cardName}>
                      <td><span className="records-centrality-rank">{index + 1}</span></td>
                      <th scope="row"><i style={{ background: suitColors[suit] }} /><span>{card.cardName}</span><small>{card.groupCount} 組</small></th>
                      <td><strong>{card.degree}</strong><small>加權 {card.weightedDegree}</small></td>
                      <td>{decimal(card.betweenness)}</td>
                      <td>{decimal(card.closeness)}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>

            <aside className="records-centrality-guide" aria-label="中心性指標說明">
              <h3>指標說明</h3>
              <dl>
                <div><dt>度中心性</dt><dd>與多少張其他牌直接共現。數字越高，代表連結範圍越廣。</dd></div>
                <div><dt>中介中心性</dt><dd>位於其他牌卡最短連線之間的程度。數值越高，越像不同牌群之間的橋樑。</dd></div>
                <div><dt>接近中心性</dt><dd>抵達整個網絡其他牌卡的便利程度。數值越高，越接近網絡結構中心。</dd></div>
              </dl>
              <p>中心性只反映目前抽牌紀錄的共現結構，不代表牌義的重要程度或預測準確度。</p>
            </aside>
          </div>
          <p className="records-centrality-footnote">顯示前 {displayedCards.length} 張，共分析 {result.connectedCards} 張相連牌卡與 {result.totalGroups} 組五牌紀錄。</p>
        </>
      )}
    </section>
  );
}
