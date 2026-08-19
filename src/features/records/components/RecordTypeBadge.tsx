import type { TarotRecordType } from "../types/tarotRecord";

type RecordTypeBadgeProps = {
  recordType?: TarotRecordType;
};

export function RecordTypeBadge({ recordType = "questioned" }: RecordTypeBadgeProps) {
  const isOpenObservation = recordType === "open_observation";
  return (
    <span className={`record-type-badge ${isOpenObservation ? "open" : "questioned"}`}>
      {isOpenObservation ? "無題觀測" : "題組觀測"}
    </span>
  );
}
