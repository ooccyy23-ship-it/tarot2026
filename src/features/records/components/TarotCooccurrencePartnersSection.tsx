import { useMemo } from "react";
import { tarotCardCatalog } from "../../../data/tarotCardCatalog";
import { buildRecordsHash, cardNameFromStableId, tarotCardStableId } from "../logic/tarotRecordNavigation";
import { buildTarotCooccurrencePartners, calculateTarotCooccurrenceMatrix } from "../logic/tarotRecordCooccurrence";
import type { ParsedTarotRecord } from "../types/tarotRecord";

export function TarotCooccurrencePartnersSection({
  records,
  selectedCardId,
  minimumCount,
  dateFrom,
  dateTo,
  onSelectedCardChange,
}: {
  records: ParsedTarotRecord[];
  selectedCardId: string;
  minimumCount: number;
  dateFrom: string;
  dateTo: string;
  onSelectedCardChange: (cardId: string) => void;
}) {
  const matrix = useMemo(() => calculateTarotCooccurrenceMatrix(records, 78), [records]);
  const selectedCardName = cardNameFromStableId(selectedCardId);
  const partners = useMemo(
    () => buildTarotCooccurrencePartners(matrix, selectedCardName, minimumCount, 10),
    [matrix, minimumCount, selectedCardName],
  );
  const selectedRecords = useMemo(
    () => records.filter((record) => record.normalizedCardName === selectedCardName),
    [records, selectedCardName],
  );
  const selectedGroupCount = useMemo(
    () => new Set(selectedRecords.map((record) => record.groupId)).size,
    [selectedRecords],
  );
  const maximumCount = Math.max(1, ...partners.map((partner) => partner.cooccurrenceCount));

  return (
    <section className="panel records-partners-panel" aria-labelledby="records-partners-title">
      <div className="section-heading records-partners-heading">
        <div>
          <p className="eyebrow">Card Co-occurrence Partners</p>
          <h2 id="records-partners-title">單張牌共現夥伴</h2>
          <p>選擇一張牌，查看它在同一五牌題組中最常與哪些牌共同出現。</p>
        </div>
        <label className="records-partners-selector">
          <span>選擇牌卡</span>
          <select value={selectedCardId} onChange={(event) => onSelectedCardChange(event.target.value)}>
            <option value="">請先選擇一張牌</option>
            {tarotCardCatalog.map((card) => (
              <option key={card.order} value={tarotCardStableId(card.order)}>{card.name}</option>
            ))}
          </select>
        </label>
      </div>

      {!selectedCardName ? (
        <div className="records-placeholder records-partners-empty"><strong>請先選擇一張牌。</strong></div>
      ) : (
        <>
          <div className="records-partners-summary">
            <div>
              <strong>{selectedCardName}</strong>
              <span>出現 {selectedRecords.length} 次 · 涉及 {selectedGroupCount} 組題組</span>
            </div>
            <a
              className="secondary-button compact-button button-link"
              href={buildRecordsHash({ cardName: selectedCardName, dateFrom, dateTo })}
            >
              查看此牌全部紀錄
            </a>
          </div>
          {partners.length === 0 ? (
            <div className="records-placeholder records-partners-empty">
              <strong>目前篩選條件下，沒有符合共現門檻的牌卡。</strong>
            </div>
          ) : (
            <ol className="records-partners-list" aria-label={`${selectedCardName}的共現夥伴`}>
              {partners.map((partner, index) => (
                <li key={partner.cardName}>
                  <span className="records-partners-rank">{index + 1}</span>
                  <strong>{partner.cardName}</strong>
                  <div className="records-partners-bar" aria-hidden="true">
                    <i style={{ width: `${(partner.cooccurrenceCount / maximumCount) * 100}%` }} />
                  </div>
                  <span className="records-partners-count">{partner.cooccurrenceCount} 次</span>
                  <a
                    className="ghost-button compact-button button-link"
                    href={buildRecordsHash({ dateFrom, dateTo }, [selectedCardName, partner.cardName])}
                    aria-label={`查看${selectedCardName}與${partner.cardName}的共同出現紀錄`}
                  >
                    查看紀錄
                  </a>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}
