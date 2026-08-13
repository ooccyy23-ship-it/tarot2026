import { describe, expect, it } from "vitest";
import type { DrawDraft } from "./drawDraftStorage";
import {
  DRAW_DRAFT_TTL_MS,
  clearDraftDraw,
  hasDraftDraw,
  isDraftExpired,
  loadDraftDraw,
  listStoredDraftDraws,
  saveDraftDraw,
  validateDraftDraw,
} from "./drawDraftStorage";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() { return data.size; },
  };
}

const baseDraft = {
  mode: "five" as const,
  contextId: "draw-tool",
  questionGroupName: "一般五抽",
  observationDate: "2026-08-12T02:00:00.000Z",
  drawTime: "20:23",
  weekday: "wednesday" as const,
  sequenceResult: null,
  validationIssues: [],
  cards: [],
  progress: "time_entered" as const,
};

describe("drawDraftStorage", () => {
  it("saves and reloads an unfinished draw", () => {
    const storage = memoryStorage();
    saveDraftDraw(baseDraft, storage, new Date("2026-08-12T02:00:00.000Z"));
    const result = loadDraftDraw("draw-tool", storage, Date.parse("2026-08-12T03:00:00.000Z"));
    expect(result.status).toBe("valid");
    if (result.status === "valid") expect(result.draft.drawTime).toBe("20:23");
  });

  it("marks a draft older than 24 hours as expired without deleting it", () => {
    const storage = memoryStorage();
    const saved = saveDraftDraw(baseDraft, storage, new Date("2026-08-10T00:00:00.000Z"));
    expect(isDraftExpired(saved, Date.parse(saved.updatedAt) + DRAW_DRAFT_TTL_MS + 1)).toBe(true);
    expect(loadDraftDraw("draw-tool", storage, Date.parse(saved.updatedAt) + DRAW_DRAFT_TTL_MS + 1).status).toBe("expired");
    expect(hasDraftDraw("draw-tool", storage)).toBe(true);
  });

  it("reports corrupted JSON instead of throwing", () => {
    const storage = memoryStorage();
    storage.setItem("tarot2026:unfinished-draw:v1:draw-tool", "{bad json");
    expect(loadDraftDraw("draw-tool", storage).status).toBe("invalid");
  });

  it("rejects inconsistent orientation progress", () => {
    const draft = {
      ...baseDraft,
      schemaVersion: 1,
      createdAt: "2026-08-12T02:00:00.000Z",
      updatedAt: "2026-08-12T02:00:00.000Z",
      cards: [
        { order: 1, sequenceKey: "s1", sequenceValue: 1, formattedSequence: "01", mapping: { sequence: 1, cardNumber: 1, cardName: "A" }, orientationResult: null },
        { order: 2, sequenceKey: "s2", sequenceValue: 2, formattedSequence: "02", mapping: { sequence: 2, cardNumber: 2, cardName: "B" }, orientationResult: { coinSide: "heads", orientation: "upright", startedAt: "x", stoppedAt: "y", durationMs: 1, locked: true } },
      ],
      sequenceResult: { hour: 1, minute: 2 },
    } as unknown as DrawDraft;
    expect(validateDraftDraw(draft)).toContain("正逆位完成順序不一致。");
  });

  it("clears only the requested draft", () => {
    const storage = memoryStorage();
    saveDraftDraw(baseDraft, storage);
    clearDraftDraw("draw-tool", storage);
    expect(hasDraftDraw("draw-tool", storage)).toBe(false);
  });

  it("preserves two completed orientations so the third card can resume", () => {
    const storage = memoryStorage();
    const orientation = { coinSide: "heads" as const, orientation: "upright" as const, startedAt: "x", stoppedAt: "y", durationMs: 10, locked: true as const };
    const sequenceResult = {
      hour: 20,
      minute: 23,
      values: { s1: 23, s2: 43, s3: 6, s4: 29, s5: 18 },
      formattedValues: { s1: "23", s2: "43", s3: "06", s4: "29", s5: "18" },
      explanations: { s1: "", s2: "", s3: [], s4: [], s5: "" },
    };
    const cards = [1, 2, 3, 4, 5].map((order) => ({
      order,
      sequenceKey: `s${order}` as "s1" | "s2" | "s3" | "s4" | "s5",
      sequenceValue: sequenceResult.values[`s${order}` as keyof typeof sequenceResult.values],
      formattedSequence: sequenceResult.formattedValues[`s${order}` as keyof typeof sequenceResult.formattedValues],
      mapping: { sequence: order, cardNumber: order, cardName: `牌 ${order}` },
      orientationResult: order <= 2 ? orientation : null,
    }));
    saveDraftDraw({ ...baseDraft, sequenceResult, cards, progress: "orientations_in_progress" }, storage);
    const result = loadDraftDraw("draw-tool", storage);
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.draft.cards.filter((card) => card.orientationResult?.locked)).toHaveLength(2);
      expect(result.draft.cards[2].orientationResult).toBeNull();
    }
  });

  it("rejects a draft from a different context", () => {
    const storage = memoryStorage();
    saveDraftDraw(baseDraft, storage);
    const raw = storage.getItem("tarot2026:unfinished-draw:v1:draw-tool");
    expect(raw).not.toBeNull();
    expect(validateDraftDraw(JSON.parse(raw!), "research:other:A")).toContain("暫存不屬於目前抽牌情境。");
  });

  it("lists valid unfinished drafts from every draw context", () => {
    const storage = memoryStorage();
    saveDraftDraw(baseDraft, storage, new Date("2026-08-12T02:00:00.000Z"));
    saveDraftDraw({ ...baseDraft, contextId: "research:one:A", questionGroupName: "研究 A" }, storage, new Date("2026-08-12T03:00:00.000Z"));
    expect(listStoredDraftDraws(storage, Date.parse("2026-08-12T04:00:00.000Z")).map((draft) => draft.contextId))
      .toEqual(["research:one:A", "draw-tool"]);
  });
});
