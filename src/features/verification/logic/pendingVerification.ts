import type { Observation } from "../../observations/types/observation";

const DAY_MS = 86_400_000;

function dateValue(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getDaysRemaining(dueDate: string | undefined, today = new Date()): number | null {
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;
  const todayDate = today.toISOString().slice(0, 10);
  return Math.round((dateValue(dueDate) - dateValue(todayDate)) / DAY_MS);
}

export function listPendingVerifications(observations: Observation[], today = new Date()): Observation[] {
  return observations
    .filter((item) => item.verification.status === "pending")
    .sort((a, b) => {
      const aDays = getDaysRemaining(a.verification.dueDate, today);
      const bDays = getDaysRemaining(b.verification.dueDate, today);
      if (aDays === null && bDays === null) return b.observationDate.localeCompare(a.observationDate);
      if (aDays === null) return 1;
      if (bDays === null) return -1;
      return aDays - bDays || b.observationDate.localeCompare(a.observationDate);
    });
}

export type VerificationResultInput = {
  actualEvent: string;
  result: NonNullable<Observation["verification"]["result"]> | "";
  evidenceSources: string[];
  verifiedAt: string;
  reflection: string;
};

export function validateVerificationResult(input: VerificationResultInput): string[] {
  const errors: string[] = [];
  if (!input.actualEvent.trim()) errors.push("請填寫實際發生事件。");
  if (!input.result) errors.push("請選擇驗證結果。");
  if (!input.verifiedAt) errors.push("請填寫驗證日期。");
  return errors;
}

export function completeVerification(
  observation: Observation,
  input: VerificationResultInput,
  now = new Date(),
): Observation {
  const errors = validateVerificationResult(input);
  if (errors.length > 0 || !input.result) throw new Error(errors.join(" "));
  return {
    ...observation,
    updatedAt: now.toISOString(),
    verification: {
      ...observation.verification,
      status: "verified",
      actualEvent: input.actualEvent.trim(),
      result: input.result,
      evidenceSources: [...input.evidenceSources],
      verifiedAt: input.verifiedAt,
      reflection: input.reflection.trim() || undefined,
    },
  };
}
