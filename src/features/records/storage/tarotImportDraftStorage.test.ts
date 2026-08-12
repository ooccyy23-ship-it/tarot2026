import { beforeEach, describe, expect, it } from "vitest";
import { clearTarotImportDraft, loadTarotImportDraft, saveTarotImportDraft, TAROT_IMPORT_DRAFT_KEY } from "./tarotImportDraftStorage";

describe("tarotImportDraftStorage", () => {
  beforeEach(() => localStorage.clear());

  it("restores an unfinished import after reload", () => {
    saveTarotImportDraft({ source: "manual_text", input: "example", group: null });
    expect(loadTarotImportDraft()).toMatchObject({ schemaVersion: 1, source: "manual_text", input: "example" });
  });

  it("does not crash on damaged data", () => {
    localStorage.setItem(TAROT_IMPORT_DRAFT_KEY, "{broken");
    expect(loadTarotImportDraft()).toBeNull();
  });

  it("clears the import independently of draw drafts", () => {
    saveTarotImportDraft({ source: "manual_text", input: "example", group: null });
    localStorage.setItem("tarot2026:unfinished-draw:v1:draw-tool", "keep");
    clearTarotImportDraft();
    expect(loadTarotImportDraft()).toBeNull();
    expect(localStorage.getItem("tarot2026:unfinished-draw:v1:draw-tool")).toBe("keep");
  });
});
