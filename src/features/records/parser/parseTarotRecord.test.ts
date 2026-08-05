import { describe, expect, it } from "vitest";
import { TarotRecordParseError } from "../types/tarotRecord";
import { parseTarotRecordDraft, parseTarotRecordText, updateDraftCardName } from "./parseTarotRecord";

const standardText = `一、情感本質觀測｜關係中的情感如何被理解

1.對方當時的情感核心是什麼？聖杯9正位
2、對方如何表達這份情感？正義正位
3．某件未完成的事代表什麼？星幣1正位
第4題 關係中斷後呈現什麼狀態？星幣5逆位
第 5 題 綜合而言應如何理解？星幣侍者逆位

115/8/5 23:02`;

describe("parseTarotRecordText", () => {
  it("parses a five-question group into five records", () => {
    const group = parseTarotRecordText(standardText);
    expect(group.groupTitle).toBe("一、情感本質觀測｜關係中的情感如何被理解");
    expect(group.groupId).toBe("GRP-20260805-2302");
    expect(group.records).toHaveLength(5);
    expect(new Set(group.records.map((record) => record.groupId))).toEqual(new Set([group.groupId]));
    expect(group.records.map((record) => record.id)).toEqual([
      "GRP-20260805-2302-01",
      "GRP-20260805-2302-02",
      "GRP-20260805-2302-03",
      "GRP-20260805-2302-04",
      "GRP-20260805-2302-05",
    ]);
  });

  it("separates question text, card name, orientation and classification", () => {
    const group = parseTarotRecordText(standardText);
    expect(group.records[0]).toMatchObject({
      questionOrder: 1,
      questionText: "對方當時的情感核心是什麼？",
      cardName: "聖杯9",
      normalizedCardName: "聖杯9",
      arcanaType: "minor",
      suit: "cups",
      rank: "9",
      orientation: "upright",
      orientationLabel: "正位",
    });
    expect(group.records[3]).toMatchObject({ orientation: "reversed", orientationLabel: "逆位" });
    expect(group.records[1]).toMatchObject({ arcanaType: "major", suit: "major", rank: "正義" });
  });

  it.each([
    ["聖杯九", "聖杯9"],
    ["錢幣1", "星幣1"],
    ["女教皇", "女祭司"],
    ["聖杯１", "聖杯1"],
  ])("normalizes card alias %s", (alias, expected) => {
    const input = standardText.replace("聖杯9正位", `${alias}正位`);
    expect(parseTarotRecordText(input).records[0].normalizedCardName).toBe(expected);
  });

  it("parses a Gregorian date", () => {
    const input = standardText.replace("115/8/5 23:02", "2026/08/05 23:02");
    expect(parseTarotRecordText(input).observationDateTime).toBe("2026-08-05T23:02:00");
  });

  it("fails with a specific error when the date is missing", () => {
    expect(() => parseTarotRecordText(standardText.replace("115/8/5 23:02", ""))).toThrow("找不到日期時間");
  });

  it("fails when only four questions are present", () => {
    const input = standardText.replace(/^第 5 題.*$/m, "");
    expect(() => parseTarotRecordText(input)).toThrow("辨識到4題");
  });

  it("fails when more than five questions are present", () => {
    const input = standardText.replace("115/8/5", "6.額外題目？世界正位\n115/8/5");
    expect(() => parseTarotRecordText(input)).toThrow("辨識到6題");
  });

  it("fails with the question order when a card is missing", () => {
    const input = standardText.replace("某件未完成的事代表什麼？星幣1正位", "某件未完成的事代表什麼？正位");
    expect(() => parseTarotRecordText(input)).toThrow("第3題缺少牌卡");
  });

  it("fails with the question order when orientation is missing", () => {
    const input = standardText.replace("星幣侍者逆位", "星幣侍者");
    expect(() => parseTarotRecordText(input)).toThrow("第5題缺少正逆位");
  });

  it("rejects an unknown card but preserves a draft for manual correction", () => {
    const input = standardText.replace("聖杯9正位", "聖杯11正位");
    expect(() => parseTarotRecordText(input)).toThrow(TarotRecordParseError);
    const result = parseTarotRecordDraft(input);
    expect(result.group?.records[0].cardName).toBe("聖杯11");
    expect(result.issues[0].message).toContain("第1題牌名");
  });

  it("keeps other row errors when manually correcting a card name", () => {
    const input = standardText.replace("聖杯9正位", "聖杯11");
    const record = parseTarotRecordDraft(input).group!.records[0];
    const corrected = updateDraftCardName(record, "聖杯9");
    expect(corrected.normalizedCardName).toBe("聖杯9");
    expect(corrected.issues.map((issue) => issue.code)).toEqual(["missing_orientation"]);
  });
});
