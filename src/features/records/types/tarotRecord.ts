export type TarotArcanaType = "major" | "minor";
export type TarotSuit = "major" | "cups" | "swords" | "wands" | "pentacles";
export type TarotOrientation = "upright" | "reversed";
export type TarotOrientationLabel = "正位" | "逆位";

export type ParsedTarotGroup = {
  groupId: string;
  groupTitle: string;
  observationDate: string;
  observationTime: string;
  observationDateTime: string;
  originalDateText: string;
  records: ParsedTarotRecord[];
};

export type ParsedTarotRecord = {
  id: string;
  groupId: string;
  observationDate: string;
  observationTime: string;
  observationDateTime: string;
  groupTitle: string;
  questionOrder: number;
  questionText: string;
  cardName: string;
  normalizedCardName: string;
  arcanaType: TarotArcanaType;
  suit: TarotSuit;
  rank: string;
  orientation: TarotOrientation;
  orientationLabel: TarotOrientationLabel;
  createdAt: string;
  updatedAt?: string;
};

export type TarotRecordGroupSummary = {
  groupId: string;
  groupTitle: string;
  observationDate: string;
  observationTime: string;
  observationDateTime: string;
  recordCount: number;
  createdAt: string;
  updatedAt?: string;
};

export type TarotRecordFilters = {
  keyword: string;
  dateFrom: string;
  dateTo: string;
  groupId: string;
  cardName: string;
  orientation: TarotOrientation | "";
  arcanaType: TarotArcanaType | "";
  suit: TarotSuit | "";
};

export type TarotRecordEditableFields = Pick<
  ParsedTarotRecord,
  "questionText" | "cardName" | "orientation"
>;

export type TarotRecordParseIssueCode =
  | "missing_title"
  | "missing_datetime"
  | "invalid_datetime"
  | "invalid_question_count"
  | "invalid_question_order"
  | "missing_question"
  | "missing_orientation"
  | "missing_card"
  | "unknown_card";

export type TarotRecordParseIssue = {
  code: TarotRecordParseIssueCode;
  message: string;
  questionOrder?: number;
};

export type ParsedTarotRecordDraft = Omit<
  ParsedTarotRecord,
  "normalizedCardName" | "arcanaType" | "suit" | "rank"
> & {
  normalizedCardName?: string;
  arcanaType?: TarotArcanaType;
  suit?: TarotSuit;
  rank?: string;
  issues: TarotRecordParseIssue[];
};

export type ParsedTarotGroupDraft = Omit<ParsedTarotGroup, "records"> & {
  records: ParsedTarotRecordDraft[];
};

export type TarotRecordParseResult = {
  group: ParsedTarotGroupDraft | null;
  issues: TarotRecordParseIssue[];
};

export class TarotRecordParseError extends Error {
  readonly issues: TarotRecordParseIssue[];

  constructor(issues: TarotRecordParseIssue[]) {
    super(issues.map((issue) => issue.message).join("\n"));
    this.name = "TarotRecordParseError";
    this.issues = issues;
  }
}
