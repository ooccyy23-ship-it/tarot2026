export type TarotArcanaType = "major" | "minor";
export type TarotSuit = "major" | "cups" | "swords" | "wands" | "pentacles";
export type TarotOrientation = "upright" | "reversed";
export type TarotOrientationLabel = "正位" | "逆位";
export type TarotRecordImportSource = "draw_result" | "manual_text";
export type TarotRecordType = "questioned" | "open_observation";

export type ParsedTarotGroup = {
  groupId: string;
  groupTitle: string;
  observationDate: string;
  observationTime: string;
  observationDateTime: string;
  originalDateText: string;
  importSource?: TarotRecordImportSource;
  drawResultId?: string;
  sourceQuestionGroupId?: string;
  drawMode?: "five";
  weekdayLabel?: string;
  sequences?: number[];
  fingerprint?: string;
  recordType?: TarotRecordType;
  observationCode?: string;
  drawMethod?: string;
  note?: string;
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
  position?: number;
  recordType?: TarotRecordType;
  observationCode?: string;
  weekdayLabel?: string;
  drawMethod?: string;
  note?: string;
  sequence?: number;
  importSource?: TarotRecordImportSource;
  drawResultId?: string;
  fingerprint?: string;
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
  importSource?: TarotRecordImportSource;
  drawResultId?: string;
  fingerprint?: string;
  recordType: TarotRecordType;
  observationCode?: string;
  drawMethod?: string;
  note?: string;
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
  recordType: TarotRecordType | "";
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
  | "unknown_card"
  | "missing_sequence"
  | "invalid_sequence_count"
  | "title_needs_confirmation"
  | "question_needs_confirmation"
  | "short_question";

export type TarotRecordParseIssue = {
  code: TarotRecordParseIssueCode;
  message: string;
  questionOrder?: number;
  severity?: "warning" | "error";
  field?: "groupTitle" | "questionText" | "cardName" | "orientation" | "sequence" | "dateTime";
};

export type TarotRecordDuplicate = Pick<
  TarotRecordGroupSummary,
  "groupId" | "groupTitle" | "observationDate" | "observationTime" | "drawResultId" | "fingerprint"
>;

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
