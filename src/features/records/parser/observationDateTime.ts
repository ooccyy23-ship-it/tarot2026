export type ParsedObservationDateTime = {
  observationDate: string;
  observationTime: string;
  observationDateTime: string;
  originalDateText: string;
};

export function convertRocYearToGregorian(year: number): number {
  return year > 1911 ? year : year + 1911;
}

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseObservationDateTime(input: string): ParsedObservationDateTime | null {
  const match = /(?:^|\s)(\d{2,4})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})\s+(\d{1,2})\s*:\s*(\d{2})(?=\s|$)/m.exec(input);
  if (!match) return null;

  const year = convertRocYearToGregorian(Number(match[1]));
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const candidate = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    year < 1
    || month < 1
    || month > 12
    || day < 1
    || hour < 0
    || hour > 23
    || minute < 0
    || minute > 59
    || candidate.getFullYear() !== year
    || candidate.getMonth() !== month - 1
    || candidate.getDate() !== day
  ) return null;

  const observationDate = `${String(year).padStart(4, "0")}-${padTwo(month)}-${padTwo(day)}`;
  const observationTime = `${padTwo(hour)}:${padTwo(minute)}`;
  return {
    observationDate,
    observationTime,
    observationDateTime: `${observationDate}T${observationTime}:00`,
    originalDateText: match[0].trim(),
  };
}

export function formatDateForDisplay(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error("日期必須使用 YYYY-MM-DD 格式。");
  return `${match[1]}/${match[2]}/${match[3]}`;
}
