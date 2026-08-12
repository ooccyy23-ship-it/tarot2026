import { describe, expect, it } from "vitest";
import { parseTarotRecordText } from "../parser/parseTarotRecord";
import { createTarotRecordCompatibilityFingerprint, createTarotRecordFingerprint } from "./tarotRecordFingerprint";

const source = `研究題組
1. 問題一？聖杯1正位
2. 問題二？寶劍2逆位
3. 問題三？權杖3正位
4. 問題四？星幣4逆位
5. 問題五？世界正位
115/8/12 22:24`;

describe("createTarotRecordFingerprint", () => {
  it("is stable for the same record content", () => {
    const group = parseTarotRecordText(source);
    expect(createTarotRecordFingerprint(group)).toBe(createTarotRecordFingerprint({ ...group }));
  });

  it("changes when an orientation changes", () => {
    const group = parseTarotRecordText(source);
    const changed = { ...group, records: group.records.map((record, index) => index === 0 ? { ...record, orientation: "reversed" as const } : record) };
    expect(createTarotRecordFingerprint(changed)).not.toBe(createTarotRecordFingerprint(group));
  });

  it("matches legacy records that did not store sequences", () => {
    const group = parseTarotRecordText(source);
    const withSequences = { ...group, sequences: [1, 2, 3, 4, 5], records: group.records.map((record, index) => ({ ...record, sequence: index + 1 })) };
    expect(createTarotRecordCompatibilityFingerprint(withSequences)).toBe(createTarotRecordCompatibilityFingerprint(group));
  });
});
