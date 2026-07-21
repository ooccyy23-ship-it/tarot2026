export type ObservationQuestion = {
  id: string;
  order: number;
  title: string;
  description?: string;
};

export type QuestionGroup = {
  id: string;
  category: string;
  title: string;
  description?: string;
  questions: ObservationQuestion[];
  source: "historical" | "custom";
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
