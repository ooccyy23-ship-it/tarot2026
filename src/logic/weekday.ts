import type { WeekdayKey } from "../types/tarot";

export const weekdayOptions: Array<{ key: WeekdayKey; label: string }> = [
  { key: "monday", label: "星期一" },
  { key: "tuesday", label: "星期二" },
  { key: "wednesday", label: "星期三" },
  { key: "thursday", label: "星期四" },
  { key: "friday", label: "星期五" },
  { key: "saturday", label: "星期六" },
  { key: "sunday", label: "星期日" },
];

const dayIndexToWeekday: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function getSystemWeekday(date = new Date()): WeekdayKey {
  return dayIndexToWeekday[date.getDay()];
}

export function getWeekdayLabel(weekday: WeekdayKey): string {
  return weekdayOptions.find((option) => option.key === weekday)?.label ?? weekday;
}
