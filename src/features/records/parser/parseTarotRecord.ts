import {
  getTarotCardMetadata,
  normalizeTarotCardName,
  tarotCardInputAliases,
} from "../../../data/tarotCardCatalog";
import type {
  ParsedTarotGroup,
  ParsedTarotGroupDraft,
  ParsedTarotRecord,
  ParsedTarotRecordDraft,
  TarotOrientationLabel,
  TarotRecordParseIssue,
  TarotRecordParseResult,
} from "../types/tarotRecord";
import { TarotRecordParseError } from "../types/tarotRecord";
import { parseObservationDateTime } from "./observationDateTime";

const questionPrefixPattern = /^\s*(?:第\s*(\d+)\s*題|([0-9]+)\s*[.、．])\s*(.*?)\s*$/;
const orientationPattern = /(正位|逆位)\s*$/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const cardSuffixPattern = new RegExp(
  `(${tarotCardInputAliases.map(escapeRegExp).join("|")})\\s*$`,
  "i",
);

function createGroupId(observationDate: string, observationTime: string): string {
  return `GRP-${observationDate.replace(/-/g, "")}-${observationTime.replace(":", "")}`;
}

function inferUnknownCardText(value: string): string {
  const punctuationIndex = Math.max(
    value.lastIndexOf("？"),
    value.lastIndexOf("?"),
    value.lastIndexOf("。"),
    value.lastIndexOf("！"),
    value.lastIndexOf("!"),
  );
  if (punctuationIndex >= 0) return value.slice(punctuationIndex + 1).trim();
  const likelyCard = /((?:聖杯|寶劍|權杖|星幣|錢幣|金幣)[^\s，。！？?]{1,8}|[^\s，。！？?]{1,6})$/.exec(value);
  return likelyCard?.[1]?.trim() ?? "";
}

function buildQuestionDraft(
  rawLine: string,
  groupId: string,
  groupTitle: string,
  dateTime: NonNullable<ReturnType<typeof parseObservationDateTime>>,
  createdAt: string,
): ParsedTarotRecordDraft | null {
  const prefixMatch = questionPrefixPattern.exec(rawLine);
  if (!prefixMatch) return null;

  const questionOrder = Number(prefixMatch[1] ?? prefixMatch[2]);
  const content = prefixMatch[3].trim();
  const issues: TarotRecordParseIssue[] = [];
  const orientationMatch = orientationPattern.exec(content);
  const orientationLabel = orientationMatch?.[1] as TarotOrientationLabel | undefined;
  const withoutOrientation = orientationMatch ? content.slice(0, orientationMatch.index).trim() : content;
  if (!orientationLabel) {
    issues.push({
      code: "missing_orientation",
      message: `第${questionOrder}題缺少正逆位。`,
      questionOrder,
    });
  }

  const cardMatch = cardSuffixPattern.exec(withoutOrientation);
  const cardName = cardMatch?.[1]?.trim() || inferUnknownCardText(withoutOrientation);
  const questionText = cardMatch
    ? withoutOrientation.slice(0, cardMatch.index).trim()
    : cardName && withoutOrientation.endsWith(cardName)
      ? withoutOrientation.slice(0, -cardName.length).trim()
      : withoutOrientation;
  const metadata = getTarotCardMetadata(cardName);

  if (!cardName) {
    issues.push({ code: "missing_card", message: `第${questionOrder}題缺少牌卡。`, questionOrder });
  } else if (!metadata) {
    issues.push({
      code: "unknown_card",
      message: `第${questionOrder}題牌名「${cardName}」不在標準78張牌中。`,
      questionOrder,
    });
  }

  return {
    id: `${groupId}-${String(questionOrder).padStart(2, "0")}`,
    groupId,
    observationDate: dateTime.observationDate,
    observationTime: dateTime.observationTime,
    observationDateTime: dateTime.observationDateTime,
    groupTitle,
    questionOrder,
    questionText,
    cardName,
    normalizedCardName: metadata?.name,
    arcanaType: metadata?.arcanaType,
    suit: metadata?.suit,
    rank: metadata?.rank,
    orientation: orientationLabel === "逆位" ? "reversed" : "upright",
    orientationLabel: orientationLabel ?? "正位",
    createdAt,
    issues,
  };
}

export function parseTarotRecordDraft(input: string): TarotRecordParseResult {
  const normalizedInput = input.trim().replace(/\r\n?/g, "\n");
  const lines = normalizedInput.split("\n").map((line) => line.trim()).filter(Boolean);
  const issues: TarotRecordParseIssue[] = [];
  if (lines.length === 0 || questionPrefixPattern.test(lines[0]) || parseObservationDateTime(lines[0])) {
    return { group: null, issues: [{ code: "missing_title", message: "找不到題組標題。" }] };
  }

  const groupTitle = lines[0].trim();
  const dateTime = parseObservationDateTime(normalizedInput);
  if (!dateTime) {
    const hasDateLikeText = /\d{2,4}\s*\/\s*\d{1,2}\s*\/\s*\d{1,2}/.test(normalizedInput);
    issues.push({
      code: hasDateLikeText ? "invalid_datetime" : "missing_datetime",
      message: hasDateLikeText ? "日期格式無法辨識。" : "找不到日期時間。",
    });
    return { group: null, issues };
  }

  const groupId = createGroupId(dateTime.observationDate, dateTime.observationTime);
  const createdAt = new Date().toISOString();
  const records = lines
    .map((line) => buildQuestionDraft(line, groupId, groupTitle, dateTime, createdAt))
    .filter((record): record is ParsedTarotRecordDraft => record !== null);

  if (records.length !== 5) {
    issues.push({
      code: "invalid_question_count",
      message: `辨識到${records.length}題，必須正好5題。`,
    });
  }

  const orders = records.map((record) => record.questionOrder);
  if (orders.length === 5 && (new Set(orders).size !== 5 || ![1, 2, 3, 4, 5].every((order) => orders.includes(order)))) {
    issues.push({
      code: "invalid_question_order",
      message: "題序必須完整且固定為1至5。",
    });
  }
  records.forEach((record) => issues.push(...record.issues));

  const group: ParsedTarotGroupDraft = {
    groupId,
    groupTitle,
    observationDate: dateTime.observationDate,
    observationTime: dateTime.observationTime,
    observationDateTime: dateTime.observationDateTime,
    originalDateText: dateTime.originalDateText,
    records: records.sort((a, b) => a.questionOrder - b.questionOrder),
  };
  return { group, issues };
}

export function validateParsedTarotGroup(group: ParsedTarotGroupDraft): TarotRecordParseIssue[] {
  const issues: TarotRecordParseIssue[] = [];
  if (group.records.length !== 5) {
    issues.push({ code: "invalid_question_count", message: `辨識到${group.records.length}題，必須正好5題。` });
  }
  const orders = group.records.map((record) => record.questionOrder);
  if (new Set(orders).size !== 5 || ![1, 2, 3, 4, 5].every((order) => orders.includes(order))) {
    issues.push({ code: "invalid_question_order", message: "題序必須完整且固定為1至5。" });
  }
  for (const record of group.records) {
    if (!record.questionText.trim()) {
      issues.push({ code: "missing_question", message: `第${record.questionOrder}題缺少題目文字。`, questionOrder: record.questionOrder });
    }
    const metadata = getTarotCardMetadata(record.cardName);
    if (!metadata) {
      issues.push({ code: "unknown_card", message: `第${record.questionOrder}題牌名「${record.cardName}」不在標準78張牌中。`, questionOrder: record.questionOrder });
    }
    if (!(["正位", "逆位"] as string[]).includes(record.orientationLabel)) {
      issues.push({ code: "missing_orientation", message: `第${record.questionOrder}題缺少正逆位。`, questionOrder: record.questionOrder });
    }
  }
  return issues;
}

export function finalizeParsedTarotGroup(group: ParsedTarotGroupDraft): ParsedTarotGroup {
  const validationIssues = validateParsedTarotGroup(group);
  if (validationIssues.length > 0) throw new TarotRecordParseError(validationIssues);
  const records: ParsedTarotRecord[] = group.records.map((record) => {
    const metadata = getTarotCardMetadata(record.cardName);
    if (!metadata) throw new Error(`第${record.questionOrder}題牌名無效。`);
    const { issues: _issues, ...recordWithoutIssues } = record;
    void _issues;
    return {
      ...recordWithoutIssues,
      normalizedCardName: metadata.name,
      arcanaType: metadata.arcanaType,
      suit: metadata.suit,
      rank: metadata.rank,
      orientation: record.orientationLabel === "正位" ? "upright" : "reversed",
    };
  });
  return { ...group, records };
}

export function parseTarotRecordText(input: string): ParsedTarotGroup {
  const result = parseTarotRecordDraft(input);
  if (!result.group || result.issues.length > 0) throw new TarotRecordParseError(result.issues);
  const validationIssues = validateParsedTarotGroup(result.group);
  if (validationIssues.length > 0) throw new TarotRecordParseError(validationIssues);
  return finalizeParsedTarotGroup(result.group);
}

export function updateDraftCardName(record: ParsedTarotRecordDraft, cardName: string): ParsedTarotRecordDraft {
  const normalizedCardName = normalizeTarotCardName(cardName);
  const metadata = normalizedCardName ? getTarotCardMetadata(normalizedCardName) : null;
  const remainingIssues = record.issues.filter((issue) => issue.code !== "unknown_card" && issue.code !== "missing_card");
  return {
    ...record,
    cardName,
    normalizedCardName: metadata?.name,
    arcanaType: metadata?.arcanaType,
    suit: metadata?.suit,
    rank: metadata?.rank,
    issues: metadata ? remainingIssues : [...remainingIssues, {
      code: "unknown_card",
      message: `第${record.questionOrder}題牌名「${cardName}」不在標準78張牌中。`,
      questionOrder: record.questionOrder,
    }],
  };
}
