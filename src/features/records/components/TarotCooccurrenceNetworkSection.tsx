import { useMemo, useState, type KeyboardEvent } from "react";
import { tarotCardCatalog } from "../../../data/tarotCardCatalog";
import {
  buildTarotCooccurrenceEdges,
  calculateTarotCooccurrenceMatrix,
} from "../logic/tarotRecordCooccurrence";
import type { ParsedTarotRecord, TarotSuit } from "../types/tarotRecord";
import { TarotCooccurrenceGroupDetails, type TarotSelectedPair } from "./TarotCooccurrenceGroupDetails";

const WIDTH = 860;
const HEIGHT = 540;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

const suitColors: Record<TarotSuit, string> = {
  major: "#8b5bb7",
  wands: "#d9792b",
  cups: "#3f82c4",
  swords: "#47979a",
  pentacles: "#738f45",
};

const suitLabels: Record<TarotSuit, string> = {
  major: "大阿爾克那",
  wands: "權杖",
  cups: "聖杯",
  swords: "寶劍",
  pentacles: "星幣",
};

const cardSuit = new Map(tarotCardCatalog.map((card) => [card.name, card.suit]));

type NetworkNode = {
  cardName: string;
  groupCount: number;
  x: number;
  y: number;
  radius: number;
  color: string;
};

function buildNetworkNodes(cards: ReturnType<typeof calculateTarotCooccurrenceMatrix>["cards"]): NetworkNode[] {
  const maxCount = Math.max(...cards.map((card) => card.groupCount), 1);
  return cards.map((card, index) => {
    const ratio = card.groupCount / maxCount;
    const outerCount = Math.max(cards.length - 1, 1);
    const angle = -Math.PI / 2 + ((index - 1) * Math.PI * 2) / outerCount;
    const isCenter = index === 0;
    const suit = cardSuit.get(card.cardName) ?? "major";
    return {
      ...card,
      x: isCenter ? CENTER_X : CENTER_X + Math.cos(angle) * 310,
      y: isCenter ? CENTER_Y : CENTER_Y + Math.sin(angle) * 195,
      radius: isCenter ? 52 : 34 + ratio * 10,
      color: suitColors[suit],
    };
  });
}

export function TarotCooccurrenceNetworkSection({ records }: { records: ParsedTarotRecord[] }) {
  const matrix = useMemo(() => calculateTarotCooccurrenceMatrix(records, 8), [records]);
  const [minimumCount, setMinimumCount] = useState(1);
  const [selectedPair, setSelectedPair] = useState<TarotSelectedPair | null>(null);
  const nodes = useMemo(() => buildNetworkNodes(matrix.cards), [matrix.cards]);
  const edges = useMemo(() => buildTarotCooccurrenceEdges(matrix, minimumCount), [matrix, minimumCount]);
  const thresholdOptions = useMemo(() => [...new Set([1, 2, 3, 5, matrix.maxCount])]
    .filter((value) => value === 1 || (value > 0 && value <= matrix.maxCount))
    .sort((left, right) => left - right), [matrix.maxCount]);

  const selectPair = (sourceIndex: number, targetIndex: number) => {
    setSelectedPair({
      firstCardName: matrix.cards[sourceIndex].cardName,
      secondCardName: matrix.cards[targetIndex].cardName,
    });
  };

  const handleEdgeKeyDown = (event: KeyboardEvent<SVGGElement>, sourceIndex: number, targetIndex: number) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    selectPair(sourceIndex, targetIndex);
  };

  return (
    <section className="panel records-network-panel" aria-labelledby="records-network-title">
      <div className="section-heading records-network-heading">
        <div>
          <p className="eyebrow">Network</p>
          <h2 id="records-network-title">牌卡共現網絡圖</h2>
          <p>節點是 Top 8 牌卡，連線代表同一五牌題組中的共現；線條越粗，代表共同出現越頻繁。</p>
        </div>
        <label className="records-network-threshold">
          <span>最低共現次數</span>
          <select value={minimumCount} onChange={(event) => { setMinimumCount(Number(event.target.value)); setSelectedPair(null); }}>
            {thresholdOptions.map((value) => <option value={value} key={value}>{value} 次以上</option>)}
          </select>
        </label>
      </div>

      {nodes.length < 2 ? (
        <div className="records-placeholder"><strong>資料不足，尚無法建立共現網絡</strong><p>至少需要一組包含兩張不同牌卡的紀錄。</p></div>
      ) : (
        <>
          <div className="records-network-canvas-scroll">
            <svg className="records-network-canvas" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="records-network-svg-title records-network-svg-description">
              <title id="records-network-svg-title">Top 8 牌卡共現網絡圖</title>
              <desc id="records-network-svg-description">最高頻牌卡位於中心，其他牌卡環繞排列，連線粗細代表共現次數。</desc>
              {edges.map((edge) => {
                const source = nodes[edge.sourceIndex];
                const target = nodes[edge.targetIndex];
                const ratio = edge.count / Math.max(matrix.maxCount, 1);
                const isSelected = selectedPair !== null && (
                  (selectedPair.firstCardName === source.cardName && selectedPair.secondCardName === target.cardName)
                  || (selectedPair.firstCardName === target.cardName && selectedPair.secondCardName === source.cardName)
                );
                return <g
                  className={`records-network-edge ${isSelected ? "is-selected" : ""}`}
                  key={`${source.cardName}-${target.cardName}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${source.cardName}與${target.cardName}共現${edge.count}次，查看原始題組`}
                  onClick={() => selectPair(edge.sourceIndex, edge.targetIndex)}
                  onKeyDown={(event) => handleEdgeKeyDown(event, edge.sourceIndex, edge.targetIndex)}
                >
                  <title>{source.cardName} × {target.cardName}：{edge.count} 次</title>
                  <line className="records-network-edge-line" x1={source.x} y1={source.y} x2={target.x} y2={target.y} style={{ strokeWidth: 1.5 + ratio * 7, opacity: 0.35 + ratio * 0.55 }} />
                  <line className="records-network-edge-hit" x1={source.x} y1={source.y} x2={target.x} y2={target.y} />
                  <text className="records-network-edge-label" x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 5}>{edge.count}</text>
                </g>;
              })}
              {nodes.map((node, index) => <g className={`records-network-node ${index === 0 ? "is-center" : ""}`} key={node.cardName} transform={`translate(${node.x} ${node.y})`}>
                <circle r={node.radius} fill={node.color} />
                <text textAnchor="middle" aria-label={`${node.cardName}，出現在${node.groupCount}組`}>
                  <tspan x="0" y="-3">{node.cardName}</tspan>
                  <tspan className="records-network-node-count" x="0" y="17">{node.groupCount} 組</tspan>
                </text>
              </g>)}
            </svg>
          </div>

          <div className="records-network-footer">
            <div className="records-network-suit-legend" aria-label="節點顏色圖例">
              {(Object.keys(suitLabels) as TarotSuit[]).map((suit) => <span key={suit}><i style={{ background: suitColors[suit] }} />{suitLabels[suit]}</span>)}
            </div>
            <small>目前顯示 {edges.length} 條連線；點擊連線可查看原始題組。</small>
          </div>
        </>
      )}

      {selectedPair ? <TarotCooccurrenceGroupDetails pair={selectedPair} records={records} onClose={() => setSelectedPair(null)} /> : null}
    </section>
  );
}
