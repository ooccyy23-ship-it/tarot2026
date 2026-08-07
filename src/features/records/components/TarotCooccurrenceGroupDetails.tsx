import { useMemo } from "react";
import { findTarotCooccurrenceGroups } from "../logic/tarotRecordCooccurrence";
import { formatDateForDisplay } from "../parser/observationDateTime";
import type { ParsedTarotRecord } from "../types/tarotRecord";

export type TarotSelectedPair = {
  firstCardName: string;
  secondCardName: string;
};

export function TarotCooccurrenceGroupDetails({
  pair,
  records,
  onClose,
}: {
  pair: TarotSelectedPair;
  records: ParsedTarotRecord[];
  onClose: () => void;
}) {
  const groups = useMemo(
    () => findTarotCooccurrenceGroups(records, pair.firstCardName, pair.secondCardName),
    [pair.firstCardName, pair.secondCardName, records],
  );

  return (
    <section className="records-cooccurrence-details" aria-live="polite">
      <header>
        <div>
          <p className="eyebrow">共同出現的原始題組</p>
          <h3>{pair.firstCardName} × {pair.secondCardName}</h3>
          <p>共出現在 {groups.length} 組五牌紀錄中。</p>
        </div>
        <button className="ghost-button compact-button" type="button" onClick={onClose}>關閉</button>
      </header>
      <div className="records-cooccurrence-group-list">
        {groups.map((group) => <article key={group.groupId}>
          <div className="records-cooccurrence-group-meta">
            <strong>{group.groupTitle}</strong>
            <span>{formatDateForDisplay(group.observationDate)}　{group.observationTime}</span>
          </div>
          <div className="records-cooccurrence-card-list">
            {group.records.map((record) => <span key={record.id} className={record.normalizedCardName === pair.firstCardName || record.normalizedCardName === pair.secondCardName ? "is-matched" : ""}>
              {record.questionOrder}. {record.cardName}{record.orientationLabel}
            </span>)}
          </div>
        </article>)}
      </div>
    </section>
  );
}
