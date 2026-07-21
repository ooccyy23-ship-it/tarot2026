export type TarotCardMapping = {
  sequence: number;
  cardNumber: number;
  cardName: string;
};

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type WeekdayMappings = Record<WeekdayKey, TarotCardMapping[]>;

export type SequenceKey = "s1" | "s2" | "s3" | "s4" | "s5";

export type SequenceResult = {
  hour: number;
  minute: number;
  values: Record<SequenceKey, number>;
  formattedValues: Record<SequenceKey, string>;
  explanations: {
    s1: string;
    s2: string;
    s3: string[];
    s4: string[];
    s5: string;
  };
};

export type ValidationIssue = {
  sequence: SequenceKey;
  label: string;
  value: number;
  reason: string;
};

export type OrientationResult = {
  coinSide: "heads" | "tails";
  orientation: "upright" | "reversed";
  startedAt: string;
  stoppedAt: string;
  durationMs: number;
  locked: boolean;
};

export type DrawCard = {
  order: number;
  sequenceKey: SequenceKey;
  sequenceValue: number;
  formattedSequence: string;
  mapping: TarotCardMapping;
  orientationResult: OrientationResult | null;
};
