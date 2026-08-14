export type OrientationAuditInput = {
  id?: unknown;
  groupId?: unknown;
  observationDate?: unknown;
  orientation?: unknown;
};

export type OrientationFormat =
  | "upright"
  | "reversed"
  | "chinese_upright"
  | "chinese_reversed"
  | "boolean_true"
  | "boolean_false"
  | "null"
  | "missing"
  | "unknown";

export type OrientationAuditPeriod = {
  period: string;
  total: number;
  upright: number;
  reversed: number;
  invalid: number;
  uprightPercentage: number | null;
  reversedPercentage: number | null;
};

function classifyOrientation(record: OrientationAuditInput): OrientationFormat {
  if (!("orientation" in record)) return "missing";
  if (record.orientation === null) return "null";
  if (record.orientation === "upright") return "upright";
  if (record.orientation === "reversed") return "reversed";
  if (record.orientation === "正位") return "chinese_upright";
  if (record.orientation === "逆位") return "chinese_reversed";
  if (record.orientation === true) return "boolean_true";
  if (record.orientation === false) return "boolean_false";
  return "unknown";
}

function dateKey(record: OrientationAuditInput): string {
  return typeof record.observationDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.observationDate)
    ? record.observationDate
    : "invalid-date";
}

function isoWeekKey(date: string): string {
  if (date === "invalid-date") return date;
  const value = new Date(`${date}T12:00:00Z`);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((value.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function buildPeriods(
  records: readonly OrientationAuditInput[],
  keyFor: (record: OrientationAuditInput) => string,
): OrientationAuditPeriod[] {
  const periods = new Map<string, { total: number; upright: number; reversed: number; invalid: number }>();
  for (const record of records) {
    const key = keyFor(record);
    const current = periods.get(key) ?? { total: 0, upright: 0, reversed: 0, invalid: 0 };
    const format = classifyOrientation(record);
    current.total += 1;
    if (format === "upright") current.upright += 1;
    else if (format === "reversed") current.reversed += 1;
    else current.invalid += 1;
    periods.set(key, current);
  }
  return [...periods.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([period, row]) => {
    const validTotal = row.upright + row.reversed;
    return {
      period,
      ...row,
      uprightPercentage: validTotal === 0 ? null : Math.round(row.upright / validTotal * 10_000) / 100,
      reversedPercentage: validTotal === 0 ? null : Math.round(row.reversed / validTotal * 10_000) / 100,
    };
  });
}

export function auditOrientationRecords(records: readonly OrientationAuditInput[]) {
  const formats: Record<OrientationFormat, number> = {
    upright: 0,
    reversed: 0,
    chinese_upright: 0,
    chinese_reversed: 0,
    boolean_true: 0,
    boolean_false: 0,
    null: 0,
    missing: 0,
    unknown: 0,
  };
  records.forEach((record) => { formats[classifyOrientation(record)] += 1; });
  const formalCount = formats.upright + formats.reversed;
  const invalidOrientationCount = records.length - formalCount;
  const nullCount = formats.null;
  const unknownFormatCount = formats.chinese_upright + formats.chinese_reversed
    + formats.boolean_true + formats.boolean_false + formats.missing + formats.unknown;

  return {
    total: records.length,
    formalCount,
    uprightCount: formats.upright,
    reversedCount: formats.reversed,
    invalidOrientationCount,
    nullCount,
    unknownFormatCount,
    formats,
    daily: buildPeriods(records, dateKey),
    weekly: buildPeriods(records, (record) => isoWeekKey(dateKey(record))),
    monthly: buildPeriods(records, (record) => dateKey(record).slice(0, 7)),
  };
}
