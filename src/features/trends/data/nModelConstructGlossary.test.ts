import { describe, expect, it } from "vitest";
import { N_MODEL_CONSTRUCT_GLOSSARY } from "./nModelConstructGlossary";

describe("nModelConstructGlossary", () => {
  it("contains the nine RC1 governance terms without duplicates", () => {
    expect(N_MODEL_CONSTRUCT_GLOSSARY).toHaveLength(9);
    expect(new Set(N_MODEL_CONSTRUCT_GLOSSARY.map((item) => item.termZh)).size).toBe(9);
    expect(new Set(N_MODEL_CONSTRUCT_GLOSSARY.map((item) => item.termEn)).size).toBe(9);
  });
});
