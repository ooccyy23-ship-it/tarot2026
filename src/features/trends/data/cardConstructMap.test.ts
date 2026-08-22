import { describe, expect, it } from "vitest";
import { CARD_CONSTRUCT_MAPPINGS, validateCardConstructMappings } from "./cardConstructMap";
import { N_MODEL_CONSTRUCT_DICTIONARY } from "./nModelConstructDictionary";

describe("cardConstructMap", () => {
  it("covers every canonical card with the five reviewed N Model batches", () => {
    const result = validateCardConstructMappings();
    expect(result.valid).toBe(true);
    expect(CARD_CONSTRUCT_MAPPINGS).toHaveLength(78);
    expect(result.mapped).toBe(78);
    expect(result.unassigned).toBe(0);
    expect(CARD_CONSTRUCT_MAPPINGS.find((item) => item.cardName === "聖杯皇后")?.category).toBe("EMOTIONAL_CONNECTION");
    expect(CARD_CONSTRUCT_MAPPINGS.find((item) => item.cardName === "月亮")?.primaryConstruct).toBe("不確定／模糊感知");
    expect(CARD_CONSTRUCT_MAPPINGS.find((item) => item.cardName === "權杖8")?.sourceVersion).toBe("v1.0");
    expect(CARD_CONSTRUCT_MAPPINGS.find((item) => item.cardName === "權杖騎士")?.primaryConstruct).toBe("動機推進／方向推進");
    expect(CARD_CONSTRUCT_MAPPINGS.find((item) => item.cardName === "寶劍1")?.primaryConstruct).toBe("認知形成／清晰辨識");
    expect(CARD_CONSTRUCT_MAPPINGS.find((item) => item.cardName === "星幣國王")?.primaryConstruct).toBe("資源統整／長期穩定");
    expect(CARD_CONSTRUCT_MAPPINGS.every((item) => item.reviewVersion === "v1.0-RC1")).toBe(true);
    expect(CARD_CONSTRUCT_MAPPINGS.every((item) => item.reviewStatus === "release_candidate")).toBe(true);
  });

  it("contains the five reviewed dictionary batches without duplicate cards", () => {
    expect(N_MODEL_CONSTRUCT_DICTIONARY).toHaveLength(78);
    expect(new Set(N_MODEL_CONSTRUCT_DICTIONARY.map((item) => item.cardName)).size).toBe(78);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.sourceBatch === "major_arcana_22")).toHaveLength(22);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.sourceBatch === "wands_14")).toHaveLength(14);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.sourceBatch === "cups_14")).toHaveLength(14);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.sourceBatch === "swords_14")).toHaveLength(14);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.sourceBatch === "pentacles_14")).toHaveLength(14);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.domain === "META")).toHaveLength(22);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.domain === "MOTIVATION")).toHaveLength(14);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.domain === "EMOTION")).toHaveLength(14);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.domain === "COGNITION")).toHaveLength(14);
    expect(N_MODEL_CONSTRUCT_DICTIONARY.filter((item) => item.domain === "REALITY_RESOURCE")).toHaveLength(14);
  });
});
