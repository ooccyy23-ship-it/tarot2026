import type { SevenDayQuestionGroupConfig } from "../types/researchSession";

export const researchSubjectToken = "{觀測對象}";

const metadata = {
  category: "7天三題組研究",
  source: "custom",
  active: true,
  createdAt: "2026-07-24T00:00:00.000Z",
  updatedAt: "2026-07-24T00:00:00.000Z",
} as const;

export const sevenDayQuestionGroups = [
  {
    key: "communication",
    code: "A",
    dimension: "Communication",
    questionGroup: {
      ...metadata,
      id: "research-7-day-communication",
      title: "A｜主動聯繫驗證｜Communication",
      description: "驗證未來 7 天內，觀測對象是否主動建立或維持聯繫。",
      questions: [
        { id: "communication-q1", order: 1, title: `未來 7 天內，${researchSubjectToken}是否會主動向我建立直接聯繫？` },
        { id: "communication-q2", order: 2, title: "若有主動聯繫，第一次最可能透過哪一種方式出現？" },
        { id: "communication-q3", order: 3, title: "第一次聯繫的主要內容最偏向哪一類？" },
        { id: "communication-q4", order: 4, title: `第一次聯繫後，${researchSubjectToken}是否會主動延續互動？` },
        { id: "communication-q5", order: 5, title: "7 天結束時，雙方聯繫狀態將呈現何種結果？" },
      ],
    },
  },
  {
    key: "interaction",
    code: "B",
    dimension: "Interaction",
    questionGroup: {
      ...metadata,
      id: "research-7-day-interaction",
      title: "B｜現實互動驗證｜Interaction",
      description: "驗證未來 7 天內，雙方是否產生任何可觀察的現實互動。",
      questions: [
        { id: "interaction-q1", order: 1, title: `未來 7 天內，我與${researchSubjectToken}之間是否會產生任何可觀察的互動？` },
        { id: "interaction-q2", order: 2, title: "這 7 天內最主要的互動形式為何？" },
        { id: "interaction-q3", order: 3, title: "實際發生的互動是否呈現正向交流？" },
        { id: "interaction-q4", order: 4, title: "互動過程是否會出現新的發展契機？" },
        { id: "interaction-q5", order: 5, title: "7 天結束時，雙方整體互動程度相較目前將如何變化？" },
      ],
    },
  },
  {
    key: "progress",
    code: "C",
    dimension: "Progress",
    questionGroup: {
      ...metadata,
      id: "research-7-day-progress",
      title: "C｜關係推進驗證｜Progress",
      description: "驗證未來 7 天內，雙方關係是否出現可觀察的推進。",
      questions: [
        { id: "progress-q1", order: 1, title: `未來 7 天內，我與${researchSubjectToken}的關係是否會出現可觀察的進展？` },
        { id: "progress-q2", order: 2, title: "若有進展，最主要會體現在哪一個方面？" },
        { id: "progress-q3", order: 3, title: "未來 7 天內，推動關係發展的主要因素為何？" },
        { id: "progress-q4", order: 4, title: "未來 7 天內，阻礙關係發展的主要因素為何？" },
        { id: "progress-q5", order: 5, title: "7 天結束時，雙方關係整體發展結果為何？" },
      ],
    },
  },
] as const satisfies readonly SevenDayQuestionGroupConfig[];

export function getSevenDayQuestionGroup(key: SevenDayQuestionGroupConfig["key"]): SevenDayQuestionGroupConfig {
  const group = sevenDayQuestionGroups.find((item) => item.key === key);
  if (!group) throw new Error(`找不到 7 天研究題組：${key}`);
  return group;
}
