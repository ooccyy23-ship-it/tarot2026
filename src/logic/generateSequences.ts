import type { SequenceKey, SequenceResult } from "../types/tarot";

export function padTwoDigits(value: number): string {
  return value.toString().padStart(2, "0");
}

function multiplyDigits(twoDigitValue: number): { formatted: string; result: number } {
  const formatted = padTwoDigits(twoDigitValue);
  const [first, second] = formatted.split("").map(Number);

  return {
    formatted,
    result: first * second,
  };
}

export function generateSequences(hour: number, minute: number): SequenceResult {
  const s1 = minute;
  const s2 = hour + minute;
  const s1Digits = multiplyDigits(s1);
  const s2Digits = multiplyDigits(s2);
  const s3Sum = s1Digits.result + s2Digits.result;
  const s3 =
    s3Sum <= 78
      ? s3Sum
      : Math.abs(s1Digits.result - s2Digits.result);
  const s4Sum = s1 + s3;
  const s4 = s4Sum <= 78 ? s4Sum : Math.abs(s1 - s3);

  const s5Source = [s1, s2, s3, s4]
    .map((value) => padTwoDigits(value))
    .join("")
    .split("")
    .map(Number);
  const s5 = s5Source.reduce((total, digit) => total + digit, 0);

  const values: Record<SequenceKey, number> = { s1, s2, s3, s4, s5 };
  const formattedValues: Record<SequenceKey, string> = {
    s1: padTwoDigits(s1),
    s2: padTwoDigits(s2),
    s3: padTwoDigits(s3),
    s4: padTwoDigits(s4),
    s5: padTwoDigits(s5),
  };

  return {
    hour,
    minute,
    values,
    formattedValues,
    explanations: {
      s1: `序號1＝分鐘＝${formattedValues.s1}`,
      s2: `序號2＝${padTwoDigits(hour)}＋${padTwoDigits(minute)}＝${formattedValues.s2}`,
      s3: [
        `${s1Digits.formatted} → ${s1Digits.formatted[0]}×${s1Digits.formatted[1]}＝${s1Digits.result}`,
        `${s2Digits.formatted} → ${s2Digits.formatted[0]}×${s2Digits.formatted[1]}＝${s2Digits.result}`,
        ...(s3Sum <= 78
          ? [`${s1Digits.result}＋${s2Digits.result}＝${formattedValues.s3}`]
          : [
              `${s1Digits.result}＋${s2Digits.result}＝${s3Sum}`,
              `${s3Sum}大於78`,
              `|${s1Digits.result}－${s2Digits.result}|＝${formattedValues.s3}`,
            ]),
      ],
      s4:
        s4Sum <= 78
          ? [`${formattedValues.s1}＋${formattedValues.s3}＝${formattedValues.s4}`]
          : [
              `${formattedValues.s1}＋${formattedValues.s3}＝${s4Sum}`,
              `${s4Sum}大於78`,
              `${formattedValues.s1}－${formattedValues.s3}＝${formattedValues.s4}`,
            ],
      s5: `${s5Source.join("＋")}＝${formattedValues.s5}`,
    },
  };
}
