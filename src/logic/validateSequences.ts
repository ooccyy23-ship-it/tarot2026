import type { SequenceResult, ValidationIssue } from "../types/tarot";

export function validateSequences(sequenceResult: SequenceResult): ValidationIssue[] {
  const entries = Object.entries(sequenceResult.values);
  const occurrencePositions = entries.reduce<Map<number, number[]>>((positions, [, value], index) => {
    if (value >= 1 && value <= 78) {
      positions.set(value, [...(positions.get(value) ?? []), index + 1]);
    }
    return positions;
  }, new Map());

  return entries.flatMap(([sequence, value], index) => {
    const label = sequence.toUpperCase().replace("S", "序號");

    if (value === 0) {
      return [
        {
          sequence: sequence as keyof SequenceResult["values"],
          label,
          value,
          reason: `序號 ${index + 1} 計算結果為 0，本次時間不適合抽牌。`,
        },
      ];
    }

    if (value < 0) {
      return [
        {
          sequence: sequence as keyof SequenceResult["values"],
          label,
          value,
          reason: `序號 ${index + 1} 計算結果為 ${value}，小於有效範圍 1～78，本次時間不適合抽牌。`,
        },
      ];
    }

    if (value > 78) {
      return [
        {
          sequence: sequence as keyof SequenceResult["values"],
          label,
          value,
          reason: `序號 ${index + 1} 計算結果為 ${value}，大於有效範圍 1～78，本次時間不適合抽牌。`,
        },
      ];
    }

    const duplicatePositions = occurrencePositions.get(value) ?? [];
    if (duplicatePositions.length > 1) {
      const positionLabels = duplicatePositions.map((position) => `第 ${position} 張`);
      const positionText = positionLabels.length === 2
        ? positionLabels.join("與")
        : `${positionLabels.slice(0, -1).join("、")}與${positionLabels[positionLabels.length - 1]}`;
      return [
        {
          sequence: sequence as keyof SequenceResult["values"],
          label,
          value,
          reason: `序號 ${value} 重複出現於${positionText}，不能進入正逆位抽牌。`,
        },
      ];
    }

    return [];
  });
}
