import { useMemo, useState } from "react";
import { calculateTarotCardClusters } from "../logic/tarotRecordClustering";
import type { ParsedTarotRecord } from "../types/tarotRecord";
import { TarotCooccurrenceGroupDetails, type TarotSelectedPair } from "./TarotCooccurrenceGroupDetails";

const clusterColors = ["#8b5bb7", "#738f45", "#3f82c4", "#d9792b", "#47979a", "#c4628f"];

export function TarotClusteringSection({ records }: { records: ParsedTarotRecord[] }) {
  const [minimumCount, setMinimumCount] = useState(1);
  const [selectedPair, setSelectedPair] = useState<TarotSelectedPair | null>(null);
  const result = useMemo(() => calculateTarotCardClusters(records, minimumCount), [minimumCount, records]);
  const thresholdOptions = useMemo(() => [...new Set([1, 2, 3, 5, result.maxPairCount])]
    .filter((value) => value === 1 || (value > 0 && value <= result.maxPairCount))
    .sort((left, right) => left - right), [result.maxPairCount]);
  const groupedCardCount = result.clusters.reduce((total, cluster) => total + cluster.cards.length, 0);

  return (
    <section className="panel records-clustering-panel" aria-labelledby="records-clustering-title">
      <div className="section-heading records-clustering-heading">
        <div>
          <p className="eyebrow">Clustering</p>
          <h2 id="records-clustering-title">牌卡聚類分析</h2>
          <p>依牌卡在同一五牌題組中的共現連結自動分群，協助辨識經常一起出現的牌群。</p>
        </div>
        <label className="records-network-threshold">
          <span>最低共現次數</span>
          <select value={minimumCount} onChange={(event) => { setMinimumCount(Number(event.target.value)); setSelectedPair(null); }}>
            {thresholdOptions.map((value) => <option value={value} key={value}>{value} 次以上</option>)}
          </select>
        </label>
      </div>

      <div className="records-clustering-note">
        <strong>如何閱讀</strong>
        <p>同一牌群表示這些牌在目前紀錄中形成較緊密的共現結構，不代表固定牌義、因果關係或心理診斷。樣本增加後，分群可能改變。</p>
      </div>

      <div className="records-clustering-summary" aria-label="聚類分析摘要">
        <span><strong>{result.clusters.length}</strong> 個牌群</span>
        <span><strong>{groupedCardCount}</strong> 張已成群牌卡</span>
        <span><strong>{result.totalGroups}</strong> 組五牌樣本</span>
      </div>

      {result.clusters.length === 0 ? (
        <div className="records-placeholder">
          <strong>目前尚未形成可辨識的牌群</strong>
          <p>{result.totalCards < 2 ? "至少需要一組包含兩張不同牌卡的紀錄。" : "可降低最低共現次數，或累積更多抽牌紀錄後再查看。"}</p>
        </div>
      ) : (
        <div className="records-cluster-grid">
          {result.clusters.map((cluster, index) => {
            const color = clusterColors[index % clusterColors.length];
            return <article className="records-cluster-card" key={cluster.id} style={{ borderTopColor: color }}>
              <header>
                <div>
                  <p className="records-cluster-label" style={{ color }}>牌群 {cluster.id}</p>
                  <strong>{cluster.cards.length} 張牌</strong>
                </div>
                <span>群內共現 {cluster.internalWeight} 次</span>
              </header>
              <div className="records-cluster-card-list">
                {cluster.cards.map((card) => <span key={card.cardName}>
                  <strong>{card.cardName}</strong>
                  <small>{card.groupCount} 組</small>
                </span>)}
              </div>
              {cluster.strongestPair ? <div className="records-cluster-strongest">
                <div>
                  <small>最強共現牌對</small>
                  <strong>{cluster.strongestPair.firstCardName} × {cluster.strongestPair.secondCardName}</strong>
                  <span>共同出現 {cluster.strongestPair.count} 次</span>
                </div>
                <button className="ghost-button compact-button" type="button" onClick={() => setSelectedPair(cluster.strongestPair ?? null)}>查看原始題組</button>
              </div> : null}
            </article>;
          })}
        </div>
      )}

      {result.ungroupedCards.length > 0 ? <details className="records-cluster-ungrouped">
        <summary>未達成群條件的牌卡（{result.ungroupedCards.length}）</summary>
        <div>{result.ungroupedCards.map((card) => <span key={card.cardName}>{card.cardName} · {card.groupCount} 組</span>)}</div>
      </details> : null}

      {selectedPair ? <TarotCooccurrenceGroupDetails pair={selectedPair} records={records} onClose={() => setSelectedPair(null)} /> : null}
    </section>
  );
}
