import type { ParsedTarotGroupDraft } from "../types/tarotRecord";

export const TAROT_IMPORT_DRAFT_KEY = "tarot2026:record-import-draft:v1";

export type TarotImportDraft = {
  schemaVersion: 1;
  source: "draw_result" | "manual_text";
  input: string;
  group: ParsedTarotGroupDraft | null;
  updatedAt: string;
};

export function saveTarotImportDraft(draft: Omit<TarotImportDraft, "schemaVersion" | "updatedAt">): void {
  localStorage.setItem(TAROT_IMPORT_DRAFT_KEY, JSON.stringify({
    ...draft,
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  } satisfies TarotImportDraft));
}

export function loadTarotImportDraft(): TarotImportDraft | null {
  const raw = localStorage.getItem(TAROT_IMPORT_DRAFT_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<TarotImportDraft>;
    if (value.schemaVersion !== 1 || !["draw_result", "manual_text"].includes(value.source ?? "")) return null;
    if (typeof value.input !== "string" || typeof value.updatedAt !== "string") return null;
    return value as TarotImportDraft;
  } catch {
    return null;
  }
}

export function clearTarotImportDraft(): void {
  localStorage.removeItem(TAROT_IMPORT_DRAFT_KEY);
}
