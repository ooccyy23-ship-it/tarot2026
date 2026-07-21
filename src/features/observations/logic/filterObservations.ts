import { getEffectiveVerificationStatus } from "../../verification/logic/verificationStatus";
import type { Observation } from "../types/observation";

export type ObservationFilters = {
  keyword: string;
  dateFrom: string;
  dateTo: string;
  questionGroupId: string;
  verificationStatus: string;
};

export function filterObservations(observations: Observation[], filters: ObservationFilters, today = new Date()): Observation[] {
  const keyword = filters.keyword.trim().toLocaleLowerCase("zh-Hant");
  return observations
    .filter((item) => {
      const searchable = [item.subjectAlias, item.topic, item.contextNote, item.questionGroupSnapshot.title]
        .filter(Boolean).join(" ").toLocaleLowerCase("zh-Hant");
      return (!keyword || searchable.includes(keyword))
        && (!filters.dateFrom || item.observationDate >= filters.dateFrom)
        && (!filters.dateTo || item.observationDate <= filters.dateTo)
        && (!filters.questionGroupId || item.questionGroupId === filters.questionGroupId)
        && (!filters.verificationStatus || getEffectiveVerificationStatus(item, today) === filters.verificationStatus);
    })
    .sort((a, b) => `${b.observationDate}T${b.drawTime}`.localeCompare(`${a.observationDate}T${a.drawTime}`));
}
