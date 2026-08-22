export type NModelConstructGlossaryEntry = {
  termZh: string;
  termEn: string;
  operationalDefinition: string;
};

// Cross-suit semantic governance terms transcribed from the v1.0-RC1 review specification.
export const N_MODEL_CONSTRUCT_GLOSSARY: NModelConstructGlossaryEntry[] = [
  { termZh: "整合", termEn: "Integration", operationalDefinition: "不同內容、階段或元素形成較完整的整體；強調「合成一體」。" },
  { termZh: "統整", termEn: "Organization", operationalDefinition: "對某一領域內容進行組織、管理與穩定化；強調「有序管理」。" },
  { termZh: "調和", termEn: "Harmonization", operationalDefinition: "不同內容之間降低衝突並取得協調；強調「關係協調」。" },
  { termZh: "調節", termEn: "Regulation", operationalDefinition: "調整某種心理、情緒或能量狀態的強度與運作；強調「動態控制」。" },
  { termZh: "推進", termEn: "Progression", operationalDefinition: "某項動機、方向、認知或實作由靜態進入發展；不等於現實事件必然發生。" },
  { termZh: "轉換", termEn: "Transition", operationalDefinition: "狀態、位置或處理模式由一種形式進入另一種形式；不預設結果好壞。" },
  { termZh: "評估", termEn: "Evaluation", operationalDefinition: "比較、衡量、回顧某項內容的意義、成本、回報或可行性；不等於已做決定。" },
  { termZh: "維持", termEn: "Maintenance", operationalDefinition: "保存既有狀態、資源、結構或功能；不等於永久不變。" },
  { termZh: "完成", termEn: "Completion", operationalDefinition: "週期、結構或處理程序達到收束狀態；不等於所有現實後果均已結束。" },
];
