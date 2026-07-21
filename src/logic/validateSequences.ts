import type { SequenceResult, ValidationIssue } from "../types/tarot";

export function validateSequences(sequenceResult: SequenceResult): ValidationIssue[] {
  return Object.entries(sequenceResult.values).flatMap(([sequence, value]) => {
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

    return [];
  });
}
