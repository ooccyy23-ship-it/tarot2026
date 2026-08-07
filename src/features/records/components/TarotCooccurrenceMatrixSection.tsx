import { useMemo, useState, type CSSProperties } from "react";
import { formatDateForDisplay } from "../parser/observationDateTime";
import {
  calculateTarotCooccurrenceMatrix,
  findTarotCooccurrenceGroups,
} from "../logic/tarotRecordCooccurrence";
import type { ParsedTarotRecord } from "../types/tarotRecord";

type SelectedPair = {
  firstCardName: string;
  secondCardName: string;
};

function heatStyle(count: number, maxCount: number): CSSProperties {
  if (count === 0 || maxCount === 0) return {};
  const ratio = count / maxCount;
  return {
    backgroundColor: `rgba(69, 111, 164, ${0.12 + ratio * 0.76})`,
    color: ratio >= 0.58 ? "#ffffff" : "#263f58",
  };
}

export function TarotCooccurrenceMatrixSection({ records }: { records: ParsedTarotRecord[] }) {
  const [selectedPair, setSelectedPair] = useState<SelectedPair | null>(null);
  const matrix = useMemo(() => calculateTarotCooccurrenceMatrix(records, 8), [records]);
  const selectedGroups = useMemo(() => selectedPair
    ? findTarotCooccurrenceGroups(records, selectedPair.firstCardName, selectedPair.secondCardName)
    : [], [records, selectedPair]);

  return (
    <section className="panel records-cooccurrence-panel" aria-labelledby="records-cooccurrence-title">
      <div className="section-heading records-cooccurrence-heading">
        <div>
          <p className="eyebrow">Co-occurrence</p>
          <h2 id="records-cooccurrence-title">牌卡共現矩陣</h2>
          <p>顯示出現頻率最高的 8 張牌；兩張牌在同一個五牌題組出現，共現次數增加 1。</p>
        </div>
        <div className="records-cooccurrence-sample">
          <strong>{matrix.totalGroups}</strong>
          <span>組五牌紀錄</span>
          {matrix.totalGroups > 0 && matrix.totalGroups < 10 ? <small>目前樣本較少</small> : null}
        </div>
      </div>

      {matrix.cards.length < 2 ? (
        <div className="records-placeholder">
          <strong>資料不足，尚無法建立共現矩陣</strong>
          <p>至少需要一組包含兩張不同牌卡的紀錄。</p>
        </div>
      ) : (
        <>
          <div className="records-cooccurrence-table-wrap">
            <table className="records-cooccurrence-table">
              <thead>
                <tr>
                  <th scope="col">牌卡</th>
                  {matrix.cards.map((card) => <th scope="col" key={card.cardName}><span>{card.cardName}</span><small>{card.groupCount} 組</small></th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.cards.map((rowCard, rowIndex) => <tr key={rowCard.cardName}>
                  <th scope="row"><span>{rowCard.cardName}</span><small>{rowCard.groupCount} 組</small></th>
                  {matrix.cards.map((columnCard, columnIndex) => {
                    const count = matrix.counts[rowIndex][columnIndex];
                    const isDiagonal = rowIndex === columnIndex;
                    const isSelected = selectedPair !== null && (
                      (selectedPair.firstCardName === rowCard.cardName && selectedPair.secondCardName === columnCard.cardName)
                      || (selectedPair.firstCardName === columnCard.cardName && selectedPair.secondCardName === rowCard.cardName)
                    );
                    return <td key={columnCard.cardName} className={isDiagonal ? "is-diagonal" : ""}>
                      {isDiagonal ? <span aria-label="同一張牌不計算">—</span> : <button
                        className={isSelected ? "is-selected" : ""}
                        type="button"
                        disabled={count === 0}
                        style={heatStyle(count, matrix.maxCount)}
                        aria-label={`${rowCard.cardName}與${columnCard.cardName}共現${count}次`}
                        onClick={() => setSelectedPair({ firstCardName: rowCard.cardName, secondCardName: columnCard.cardName })}
                      >{count}</button>}
                    </td>;
                  })}
                </tr>)}
              </tbody>
            </table>
          </div>

          <div className="records-cooccurrence-legend" aria-label={`共現熱度由 1 至 ${matrix.maxCount}`}>
            <span>共現次數</span><small>1</small><i /><small>{matrix.maxCount}</small>
          </div>
        </>
      )}

      {selectedPair ? <section className="records-cooccurrence-details" aria-live="polite">
        <header>
          <div>
            <p className="eyebrow">共同出現的原始題組</p>
            <h3>{selectedPair.firstCardName} × {selectedPair.secondCardName}</h3>
            <p>共出現在 {selectedGroups.length} 組五牌紀錄中。</p>
          </div>
          <button className="ghost-button compact-button" type="button" onClick={() => setSelectedPair(null)}>關閉</button>
        </header>
        <div className="records-cooccurrence-group-list">
          {selectedGroups.map((group) => <article key={group.groupId}>
            <div className="records-cooccurrence-group-meta">
              <strong>{group.groupTitle}</strong>
              <span>{formatDateForDisplay(group.observationDate)}　{group.observationTime}</span>
            </div>
            <div className="records-cooccurrence-card-list">
              {group.records.map((record) => <span key={record.id} className={record.normalizedCardName === selectedPair.firstCardName || record.normalizedCardName === selectedPair.secondCardName ? "is-matched" : ""}>
                {record.questionOrder}. {record.cardName}{record.orientationLabel}
              </span>)}
            </div>
          </article>)}
        </div>
      </section> : null}
    </section>
  );
}
