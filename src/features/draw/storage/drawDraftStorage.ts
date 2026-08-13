import type {
  DrawCard,
  SequenceResult,
  SingleSequenceResult,
  ValidationIssue,
  WeekdayKey,
} from "../../../types/tarot";

export const DRAW_DRAFT_STORAGE_PREFIX = "tarot2026:unfinished-draw:v1";
export const DRAW_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export type DrawDraftMode = "five" | "single";

export type DrawDraft = {
  schemaVersion: 1;
  mode: DrawDraftMode;
  contextId: string;
  questionGroupId?: string;
  questionGroupName: string;
  observationDate: string;
  drawTime: string;
  weekday: WeekdayKey;
  sequenceResult: SequenceResult | SingleSequenceResult | null;
  validationIssues: ValidationIssue[];
  cards: DrawCard[];
  progress: "time_entered" | "sequences_ready" | "orientations_in_progress" | "awaiting_save";
  createdAt: string;
  updatedAt: string;
};

export type DrawDraftLoadResult =
  | { status: "none" }
  | { status: "valid" | "expired"; draft: DrawDraft }
  | { status: "invalid"; errors: string[]; raw: string };

const weekdays: WeekdayKey[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

function storageKey(contextId: string): string {
  return `${DRAW_DRAFT_STORAGE_PREFIX}:${encodeURIComponent(contextId)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validateOrientation(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return (value.coinSide === "heads" || value.coinSide === "tails")
    && (value.orientation === "upright" || value.orientation === "reversed")
    && typeof value.startedAt === "string"
    && typeof value.stoppedAt === "string"
    && typeof value.durationMs === "number"
    && value.locked === true;
}

function validateCard(value: unknown, index: number, errors: string[]): value is DrawCard {
  if (!isRecord(value)) {
    errors.push(`第 ${index + 1} 張牌資料格式錯誤。`);
    return false;
  }
  const mapping = value.mapping;
  const valid = typeof value.order === "number"
    && typeof value.sequenceKey === "string"
    && typeof value.sequenceValue === "number"
    && typeof value.formattedSequence === "string"
    && isRecord(mapping)
    && typeof mapping.sequence === "number"
    && typeof mapping.cardNumber === "number"
    && typeof mapping.cardName === "string"
    && validateOrientation(value.orientationResult);
  if (!valid) errors.push(`第 ${index + 1} 張牌缺少必要欄位。`);
  return valid;
}

export function validateDraftDraw(value: unknown, expectedContextId?: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return ["暫存內容不是有效物件。"];
  if (value.schemaVersion !== 1) errors.push("暫存版本不受支援。");
  if (value.mode !== "five" && value.mode !== "single") errors.push("抽牌模式無效。");
  if (typeof value.contextId !== "string" || !value.contextId) errors.push("缺少抽牌情境識別碼。");
  if (expectedContextId && value.contextId !== expectedContextId) errors.push("暫存不屬於目前抽牌情境。");
  if (typeof value.questionGroupName !== "string" || !value.questionGroupName) errors.push("缺少題組名稱。");
  if (!isIsoDate(value.observationDate)) errors.push("抽牌日期格式無效。");
  if (typeof value.drawTime !== "string" || value.drawTime.length > 5) errors.push("抽牌時間格式無效。");
  if (!weekdays.includes(value.weekday as WeekdayKey)) errors.push("星期對照資料無效。");
  if (!isIsoDate(value.createdAt) || !isIsoDate(value.updatedAt)) errors.push("暫存時間格式無效。");
  if (!Array.isArray(value.validationIssues)) errors.push("序號驗證資料格式無效。");
  if (value.sequenceResult !== null) {
    if (!isRecord(value.sequenceResult)) {
      errors.push("五序號資料格式無效。");
    } else if (value.mode === "five") {
      const values = value.sequenceResult.values;
      const formatted = value.sequenceResult.formattedValues;
      const explanations = value.sequenceResult.explanations;
      if (!isRecord(values) || !isRecord(formatted)
        || !isRecord(explanations)
        || ["s1", "s2", "s3", "s4", "s5"].some((key) => typeof values[key] !== "number" || typeof formatted[key] !== "string")
        || typeof explanations.s1 !== "string" || typeof explanations.s2 !== "string"
        || !Array.isArray(explanations.s3) || !Array.isArray(explanations.s4) || typeof explanations.s5 !== "string") {
        errors.push("五序號資料格式無效。");
      }
    } else if (typeof value.sequenceResult.sequence !== "number"
      || typeof value.sequenceResult.formattedSequence !== "string"
      || typeof value.sequenceResult.explanation !== "string") {
      errors.push("單抽序號資料格式無效。");
    }
  }
  if (!Array.isArray(value.cards)) {
    errors.push("牌卡資料格式無效。");
    return errors;
  }

  const mode = value.mode;
  const maxCards = mode === "five" ? 5 : 1;
  if (value.cards.length > maxCards) errors.push("牌卡數量超出合理範圍。");
  value.cards.forEach((card, index) => validateCard(card, index, errors));
  const lockedFlags = value.cards.map((card) => isRecord(card.orientationResult) && card.orientationResult.locked === true);
  const firstUnlocked = lockedFlags.indexOf(false);
  if (firstUnlocked >= 0 && lockedFlags.slice(firstUnlocked + 1).some(Boolean)) {
    errors.push("正逆位完成順序不一致。");
  }
  if (value.cards.length > 0 && !isRecord(value.sequenceResult)) errors.push("已有牌卡但缺少序號結果。");
  if (!["time_entered", "sequences_ready", "orientations_in_progress", "awaiting_save"].includes(String(value.progress))) {
    errors.push("抽牌進度狀態無效。");
  }
  return errors;
}

export function isDraftExpired(draft: DrawDraft, now = Date.now()): boolean {
  return now - Date.parse(draft.updatedAt) > DRAW_DRAFT_TTL_MS;
}

export function loadDraftDraw(
  contextId: string,
  storage: Pick<Storage, "getItem"> = window.localStorage,
  now = Date.now(),
): DrawDraftLoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(storageKey(contextId));
  } catch (reason) {
    return { status: "invalid", errors: [reason instanceof Error ? reason.message : "瀏覽器暫存無法讀取。"], raw: "" };
  }
  if (!raw) return { status: "none" };
  try {
    const parsed: unknown = JSON.parse(raw);
    const errors = validateDraftDraw(parsed, contextId);
    if (errors.length > 0) return { status: "invalid", errors, raw };
    const draft = parsed as DrawDraft;
    return { status: isDraftExpired(draft, now) ? "expired" : "valid", draft };
  } catch (reason) {
    return {
      status: "invalid",
      errors: [reason instanceof Error ? reason.message : "暫存 JSON 無法解析。"],
      raw,
    };
  }
}

export function saveDraftDraw(
  draft: Omit<DrawDraft, "schemaVersion" | "createdAt" | "updatedAt">,
  storage: Pick<Storage, "getItem" | "setItem"> = window.localStorage,
  now = new Date(),
): DrawDraft {
  const key = storageKey(draft.contextId);
  const current = storage.getItem(key);
  let createdAt = now.toISOString();
  if (current) {
    try {
      const parsed = JSON.parse(current) as Partial<DrawDraft>;
      if (isIsoDate(parsed.createdAt)) createdAt = parsed.createdAt;
    } catch {
      // A valid write replaces a corrupted draft while retaining no corrupted fields.
    }
  }
  const saved: DrawDraft = {
    ...draft,
    schemaVersion: 1,
    createdAt,
    updatedAt: now.toISOString(),
  };
  storage.setItem(key, JSON.stringify(saved));
  return saved;
}

export function clearDraftDraw(
  contextId: string,
  storage: Pick<Storage, "removeItem"> = window.localStorage,
): void {
  storage.removeItem(storageKey(contextId));
}

export function hasDraftDraw(
  contextId: string,
  storage: Pick<Storage, "getItem"> = window.localStorage,
): boolean {
  return storage.getItem(storageKey(contextId)) !== null;
}

export function getDraftDrawMode(contextId: string): DrawDraftMode | null {
  const result = loadDraftDraw(contextId);
  return result.status === "valid" || result.status === "expired" ? result.draft.mode : null;
}

export function listStoredDraftDraws(
  storage: Pick<Storage, "getItem" | "key" | "length"> = window.localStorage,
  now = Date.now(),
): DrawDraft[] {
  const drafts: DrawDraft[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(`${DRAW_DRAFT_STORAGE_PREFIX}:`)) continue;
    const contextId = decodeURIComponent(key.slice(DRAW_DRAFT_STORAGE_PREFIX.length + 1));
    const result = loadDraftDraw(contextId, storage, now);
    if (result.status === "valid" || result.status === "expired") drafts.push(result.draft);
  }
  return drafts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
