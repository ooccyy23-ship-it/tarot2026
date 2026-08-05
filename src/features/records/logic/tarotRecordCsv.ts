import type { ParsedTarotRecord } from "../types/tarotRecord";

const csvColumns: (keyof ParsedTarotRecord)[] = [
  "id",
  "groupId",
  "observationDate",
  "observationTime",
  "observationDateTime",
  "groupTitle",
  "questionOrder",
  "questionText",
  "cardName",
  "arcanaType",
  "suit",
  "rank",
  "orientation",
  "orientationLabel",
  "createdAt",
];

function csvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function createTarotRecordsCsv(records: ParsedTarotRecord[]): string {
  const header = csvColumns.join(",");
  const rows = records.map((record) => csvColumns.map((column) => csvCell(record[column])).join(","));
  return `\uFEFF${[header, ...rows].join("\r\n")}`;
}

export function tarotRecordsCsvFilename(date = new Date()): string {
  const dateKey = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
    .join("");
  return `tarot-records-${dateKey}.csv`;
}
