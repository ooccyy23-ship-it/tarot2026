import type { SequenceResult, ValidationIssue } from "../types/tarot";

export function validateSequences(sequenceResult: SequenceResult): ValidationIssue[] {
  const entries = Object.entries(sequenceResult.values);
  const occurrenceCounts = entries.reduce<Map<number, number>>((counts, [, value]) => {
    if (value >= 1 && value <= 78) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return counts;
  }, new Map());

  return entries.flatMap(([sequence, value]) => {
    const label = sequence.toUpperCase().replace("S", "序號");

    if (value === 0) {
      return [
        {
          sequence: sequence as keyof SequenceResult["values"],
          label,
          value,
          reason: "序號不可為0",
        },
      ];
    }

    if (value < 0) {
      return [
        {
          sequence: sequence as keyof SequenceResult["values"],
          label,
          value,
          reason: "序號不可小於0",
        },
      ];
    }

    if (value > 78) {
      return [
        {
          sequence: sequence as keyof SequenceResult["values"],
          label,
          value,
          reason: "序號不可大於78",
        },
      ];
    }

    const occurrenceCount = occurrenceCounts.get(value) ?? 0;
    if (occurrenceCount > 1) {
      return [
        {
          sequence: sequence as keyof SequenceResult["values"],
          label,
          value,
          reason: `序號重複：數值 ${value} 共出現 ${occurrenceCount} 次`,
        },
      ];
    }

    return [];
  });
}
