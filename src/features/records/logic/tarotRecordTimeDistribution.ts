import type { ParsedTarotRecord } from "../types/tarotRecord";

export type DrawTimePeriodId = "overnight" | "morning" | "afternoon" | "evening";

export type DrawTimePeriod = {
  id: DrawTimePeriodId;
  label: string;
  rangeLabel: string;
  count: number;
  percentage: number;
};

export type DrawTimeHour = {
  hour: number;
  label: string;
  rangeLabel: string;
  count: number;
};

export type DrawTimeDistribution = {
  validGroupCount: number;
  invalidGroupCount: number;
  periods: DrawTimePeriod[];
  hours: DrawTimeHour[];
  peakPeriod: DrawTimePeriod | null;
  peakHour: DrawTimeHour | null;
};

const periodDefinitions: Array<Pick<DrawTimePeriod, "id" | "label" | "rangeLabel"> & { start: number; end: number }> = [
  { id: "overnight", label: "凌晨", rangeLabel: "00:00–05:59", start: 0, end: 5 },
  { id: "morning", label: "上午", rangeLabel: "06:00–11:59", start: 6, end: 11 },
  { id: "afternoon", label: "下午", rangeLabel: "12:00–17:59", start: 12, end: 17 },
  { id: "evening", label: "晚上", rangeLabel: "18:00–23:59", start: 18, end: 23 },
];

function parseObservationHour(value: string): number | null {
  const match = value.trim().match(/^([01]\d|2[0-3]):[0-5]\d$/);
  return match ? Number(match[1]) : null;
}

function formatHour(hour: number): string {
  return String(hour).padStart(2, "0");
}

export function calculateDrawTimeDistribution(records: ParsedTarotRecord[]): DrawTimeDistribution {
  const timeByGroup = new Map<string, string>();
  records.forEach((record) => {
    const existing = timeByGroup.get(record.groupId);
    if (existing === undefined || parseObservationHour(existing) === null) {
      timeByGroup.set(record.groupId, record.observationTime);
    }
  });

  const hourCounts = Array.from({ length: 24 }, () => 0);
  let invalidGroupCount = 0;
  timeByGroup.forEach((time) => {
    const hour = parseObservationHour(time);
    if (hour === null) invalidGroupCount += 1;
    else hourCounts[hour] += 1;
  });

  const validGroupCount = hourCounts.reduce((sum, count) => sum + count, 0);
  const hours = hourCounts.map((count, hour) => ({
    hour,
    label: formatHour(hour),
    rangeLabel: `${formatHour(hour)}:00–${formatHour(hour)}:59`,
    count,
  }));
  const periods = periodDefinitions.map(({ id, label, rangeLabel, start, end }) => {
    const count = hourCounts.slice(start, end + 1).reduce((sum, value) => sum + value, 0);
    return {
      id,
      label,
      rangeLabel,
      count,
      percentage: validGroupCount ? (count / validGroupCount) * 100 : 0,
    };
  });
  const peakPeriod = validGroupCount
    ? periods.reduce((peak, period) => period.count > peak.count ? period : peak)
    : null;
  const peakHour = validGroupCount
    ? hours.reduce((peak, hour) => hour.count > peak.count ? hour : peak)
    : null;

  return { validGroupCount, invalidGroupCount, periods, hours, peakPeriod, peakHour };
}
