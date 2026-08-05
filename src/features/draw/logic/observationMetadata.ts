const weekdayLabels = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] as const;

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function getLocalDateParts(date: Date) {
  if (Number.isNaN(date.getTime())) throw new Error("觀測日期無效。");
  return {
    year: String(date.getFullYear()).padStart(4, "0"),
    month: padTwoDigits(date.getMonth() + 1),
    day: padTwoDigits(date.getDate()),
    weekdayLabel: weekdayLabels[date.getDay()],
  };
}

export function formatObservationDate(date: Date): string {
  const { year, month, day, weekdayLabel } = getLocalDateParts(date);
  return `${year}/${month}/${day}（${weekdayLabel}）`;
}

export function createObservationId(date: Date, drawTime: string): string {
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(drawTime);
  if (!timeMatch) throw new Error("抽牌時間必須使用 HH:MM 格式。");

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) throw new Error("抽牌時間無效。");

  const { year, month, day } = getLocalDateParts(date);
  return `OBS-${year}${month}${day}-${timeMatch[1]}${timeMatch[2]}`;
}
