import type { NModelDomain, TrendConstructId } from "../types/trendAnalysis";

export type NModelConstructEntry = {
  cardName: string;
  primaryConstruct: string;
  category: TrendConstructId;
  domain: NModelDomain;
  sourceBatch: "major_arcana_22" | "wands_14" | "cups_14" | "swords_14" | "pentacles_14";
  sourceVersion: "v1.0";
  reviewVersion: "v1.0-RC1";
  reviewStatus: "release_candidate";
};

const V1 = "v1.0" as const;
const RC1 = "v1.0-RC1" as const;
const REVIEW_STATUS = "release_candidate" as const;

const DOMAIN_BY_BATCH: Record<NModelConstructEntry["sourceBatch"], NModelDomain> = {
  major_arcana_22: "META",
  wands_14: "MOTIVATION",
  cups_14: "EMOTION",
  swords_14: "COGNITION",
  pentacles_14: "REALITY_RESOURCE",
};

// The primary constructs below are transcribed from the reviewed N Model dictionaries.
// `category` is the stable ten-category aggregation used by the trend dashboard; the
// source construct remains attached so every aggregation can be audited later.
const N_MODEL_CONSTRUCT_SOURCE: Omit<NModelConstructEntry, "domain" | "reviewVersion" | "reviewStatus">[] = [
  { cardName: "愚者", primaryConstruct: "新階段／未知可能", category: "UNCERTAINTY", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "魔術師", primaryConstruct: "能動性／資源運用", category: "ACTION_MOMENTUM", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "女祭司", primaryConstruct: "內在辨識／隱性內容", category: "COGNITIVE_PROCESSING", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "皇后", primaryConstruct: "滋養／生成", category: "STABILITY_HOLDING", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "皇帝", primaryConstruct: "結構／控制", category: "RELATIONSHIP_STRUCTURE", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "教皇", primaryConstruct: "規範／既有價值", category: "RELATIONSHIP_STRUCTURE", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "戀人", primaryConstruct: "連結／價值選擇", category: "EMOTIONAL_CONNECTION", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "戰車", primaryConstruct: "方向推進／自主控制", category: "ACTION_MOMENTUM", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "力量", primaryConstruct: "自我調節／內在承受", category: "STABILITY_HOLDING", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "隱者", primaryConstruct: "內省／退回內在", category: "COGNITIVE_PROCESSING", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "命運之輪", primaryConstruct: "週期變化／外部變數", category: "TRANSFORMATION_CHANGE", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "正義", primaryConstruct: "衡量／原則判斷", category: "WAITING_EVALUATION", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "吊人", primaryConstruct: "停留／觀點轉換", category: "WAITING_EVALUATION", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "死神", primaryConstruct: "狀態轉換／結束更新", category: "TRANSFORMATION_CHANGE", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "節制", primaryConstruct: "整合／調和", category: "STABILITY_HOLDING", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "惡魔", primaryConstruct: "強連結／受限", category: "DEFENSE_LIMITATION", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "高塔", primaryConstruct: "結構破裂／突發改變", category: "TRANSFORMATION_CHANGE", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "星星", primaryConstruct: "希望／未來參照", category: "WAITING_EVALUATION", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "月亮", primaryConstruct: "不確定／模糊感知", category: "UNCERTAINTY", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "太陽", primaryConstruct: "清晰／生命力", category: "STABILITY_HOLDING", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "審判", primaryConstruct: "回顧／重新評估", category: "COGNITIVE_PROCESSING", sourceBatch: "major_arcana_22", sourceVersion: V1 },
  { cardName: "世界", primaryConstruct: "完成／整合", category: "TRANSFORMATION_CHANGE", sourceBatch: "major_arcana_22", sourceVersion: V1 },

  { cardName: "權杖1", primaryConstruct: "動機啟動／新方向", category: "ACTION_MOMENTUM", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖2", primaryConstruct: "方向選擇／未來規劃", category: "WAITING_EVALUATION", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖3", primaryConstruct: "方向延伸／外部展望", category: "ACTION_MOMENTUM", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖4", primaryConstruct: "階段穩定／共同基礎", category: "STABILITY_HOLDING", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖5", primaryConstruct: "競爭張力／能量衝突", category: "DEFENSE_LIMITATION", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖6", primaryConstruct: "成果確認／外部認可", category: "STABILITY_HOLDING", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖7", primaryConstruct: "立場維持／防衛投入", category: "DEFENSE_LIMITATION", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖8", primaryConstruct: "快速流動／進程加速", category: "ACTION_MOMENTUM", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖9", primaryConstruct: "持續戒備／韌性維持", category: "DEFENSE_LIMITATION", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖10", primaryConstruct: "承擔／負荷", category: "DEFENSE_LIMITATION", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖侍者", primaryConstruct: "動機探索／初步可能", category: "ACTION_MOMENTUM", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖騎士", primaryConstruct: "動機推進／方向推進", category: "ACTION_MOMENTUM", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖皇后", primaryConstruct: "自主動機／內在確信", category: "ACTION_MOMENTUM", sourceBatch: "wands_14", sourceVersion: V1 },
  { cardName: "權杖國王", primaryConstruct: "方向統整／意志主導", category: "ACTION_MOMENTUM", sourceBatch: "wands_14", sourceVersion: V1 },

  { cardName: "聖杯1", primaryConstruct: "情感萌生／情感開放", category: "EMOTIONAL_CONNECTION", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯2", primaryConstruct: "雙向連結／關係互惠", category: "EMOTIONAL_CONNECTION", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯3", primaryConstruct: "情感交流／共享連結", category: "EMOTIONAL_CONNECTION", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯4", primaryConstruct: "情感評估／回應保留", category: "WAITING_EVALUATION", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯5", primaryConstruct: "情感失落／遺憾", category: "EMOTIONAL_LOSS", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯6", primaryConstruct: "過往參照／情感熟悉", category: "COGNITIVE_PROCESSING", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯7", primaryConstruct: "情感想像／多重可能", category: "UNCERTAINTY", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯8", primaryConstruct: "情感位置轉換／意義搜尋", category: "TRANSFORMATION_CHANGE", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯9", primaryConstruct: "主觀滿足／情感價值", category: "EMOTIONAL_CONNECTION", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯10", primaryConstruct: "情感整合／關係完整性", category: "RELATIONSHIP_STRUCTURE", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯侍者", primaryConstruct: "情感探索／初步感受", category: "EMOTIONAL_CONNECTION", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯騎士", primaryConstruct: "情感方向化／表達傾向", category: "EMOTIONAL_CONNECTION", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯皇后", primaryConstruct: "情感感受／內在承接", category: "EMOTIONAL_CONNECTION", sourceBatch: "cups_14", sourceVersion: V1 },
  { cardName: "聖杯國王", primaryConstruct: "情感統整／情緒調節", category: "STABILITY_HOLDING", sourceBatch: "cups_14", sourceVersion: V1 },

  { cardName: "寶劍1", primaryConstruct: "認知形成／清晰辨識", category: "COGNITIVE_PROCESSING", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍2", primaryConstruct: "認知取捨／決策暫置", category: "WAITING_EVALUATION", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍3", primaryConstruct: "心理傷痛／分離辨識", category: "EMOTIONAL_LOSS", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍4", primaryConstruct: "認知休止／心理恢復", category: "WAITING_EVALUATION", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍5", primaryConstruct: "衝突代價／對立處理", category: "DEFENSE_LIMITATION", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍6", primaryConstruct: "認知過渡／心理移轉", category: "TRANSFORMATION_CHANGE", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍7", primaryConstruct: "策略處理／資訊保留", category: "DEFENSE_LIMITATION", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍8", primaryConstruct: "認知受限／行動約束", category: "DEFENSE_LIMITATION", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍9", primaryConstruct: "心理負荷／反覆認知", category: "DEFENSE_LIMITATION", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍10", primaryConstruct: "認知終點／心理耗竭", category: "TRANSFORMATION_CHANGE", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍侍者", primaryConstruct: "資訊探索／認知警覺", category: "COGNITIVE_PROCESSING", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍騎士", primaryConstruct: "認知推進／快速判斷", category: "COGNITIVE_PROCESSING", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍皇后", primaryConstruct: "理性辨識／界線判斷", category: "COGNITIVE_PROCESSING", sourceBatch: "swords_14", sourceVersion: V1 },
  { cardName: "寶劍國王", primaryConstruct: "理性統整／決策框架", category: "COGNITIVE_PROCESSING", sourceBatch: "swords_14", sourceVersion: V1 },

  { cardName: "星幣1", primaryConstruct: "現實機會／具體起點", category: "ACTION_MOMENTUM", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣2", primaryConstruct: "資源調度／現實平衡", category: "STABILITY_HOLDING", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣3", primaryConstruct: "協作投入／共同建構", category: "RELATIONSHIP_STRUCTURE", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣4", primaryConstruct: "資源保留／穩定維持", category: "STABILITY_HOLDING", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣5", primaryConstruct: "現實匱乏／支持缺口", category: "DEFENSE_LIMITATION", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣6", primaryConstruct: "資源交換／支持平衡", category: "RELATIONSHIP_STRUCTURE", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣7", primaryConstruct: "投入評估／長期回報", category: "WAITING_EVALUATION", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣8", primaryConstruct: "持續投入／實作累積", category: "ACTION_MOMENTUM", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣9", primaryConstruct: "自主穩定／個體完整", category: "STABILITY_HOLDING", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣10", primaryConstruct: "長期結構／系統穩定", category: "RELATIONSHIP_STRUCTURE", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣侍者", primaryConstruct: "現實探索／初步實作", category: "ACTION_MOMENTUM", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣騎士", primaryConstruct: "穩定投入／持續執行", category: "ACTION_MOMENTUM", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣皇后", primaryConstruct: "現實照顧／資源維持", category: "STABILITY_HOLDING", sourceBatch: "pentacles_14", sourceVersion: V1 },
  { cardName: "星幣國王", primaryConstruct: "資源統整／長期穩定", category: "STABILITY_HOLDING", sourceBatch: "pentacles_14", sourceVersion: V1 },
];

export const N_MODEL_CONSTRUCT_DICTIONARY: NModelConstructEntry[] = N_MODEL_CONSTRUCT_SOURCE.map((entry) => ({
  ...entry,
  domain: DOMAIN_BY_BATCH[entry.sourceBatch],
  reviewVersion: RC1,
  reviewStatus: REVIEW_STATUS,
}));

export const N_MODEL_CONSTRUCT_BY_NAME = Object.fromEntries(
  N_MODEL_CONSTRUCT_DICTIONARY.map((entry) => [entry.cardName, entry]),
) as Record<string, NModelConstructEntry>;
