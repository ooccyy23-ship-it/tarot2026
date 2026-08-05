import type { TarotArcanaType, TarotSuit } from "../features/records/types/tarotRecord";

export type TarotCardCatalogEntry = {
  order: number;
  name: string;
  arcanaType: TarotArcanaType;
  suit: TarotSuit;
  rank: string;
};

const majorNames = [
  "愚者", "魔術師", "女祭司", "皇后", "皇帝", "教皇", "戀人", "戰車", "力量", "隱者", "命運之輪",
  "正義", "吊人", "死神", "節制", "惡魔", "高塔", "星星", "月亮", "太陽", "審判", "世界",
] as const;

const minorSuits = [
  { label: "權杖", suit: "wands" },
  { label: "聖杯", suit: "cups" },
  { label: "寶劍", suit: "swords" },
  { label: "星幣", suit: "pentacles" },
] as const;

const minorRanks = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "侍者", "騎士", "皇后", "國王"] as const;

export const tarotCardCatalog: TarotCardCatalogEntry[] = [
  ...majorNames.map((name, index) => ({
    order: index,
    name,
    arcanaType: "major" as const,
    suit: "major" as const,
    rank: name,
  })),
  ...minorSuits.flatMap((suitEntry, suitIndex) => minorRanks.map((rank, rankIndex) => ({
    order: 22 + suitIndex * minorRanks.length + rankIndex,
    name: `${suitEntry.label}${rank}`,
    arcanaType: "minor" as const,
    suit: suitEntry.suit,
    rank,
  }))),
];

export const tarotCardNames = tarotCardCatalog.map((card) => card.name);

const chineseNumerals: Record<string, string> = {
  一: "1", 二: "2", 三: "3", 四: "4", 五: "5", 六: "6", 七: "7", 八: "8", 九: "9", 十: "10",
};

function normalizeCharacters(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/錢幣|金幣/g, "星幣")
    .replace(/^法王$/, "教皇")
    .replace(/^女教皇$/, "女祭司")
    .replace(/^審判者$/, "審判")
    .replace(/^隱士$/, "隱者");
}

export function normalizeTarotCardName(input: string): string | null {
  let normalized = normalizeCharacters(input);
  normalized = normalized.replace(/^(聖杯|寶劍|權杖|星幣)(?:王牌|ACE|A)$/i, (_, suit: string) => `${suit}1`);
  normalized = normalized.replace(/^(聖杯|寶劍|權杖|星幣)(一|二|三|四|五|六|七|八|九|十)$/, (_, suit: string, numeral: string) => (
    `${suit}${chineseNumerals[numeral]}`
  ));
  return tarotCardNames.includes(normalized) ? normalized : null;
}

export function getTarotCardMetadata(input: string): TarotCardCatalogEntry | null {
  const normalized = normalizeTarotCardName(input);
  if (!normalized) return null;
  return tarotCardCatalog.find((card) => card.name === normalized) ?? null;
}

export const tarotCardInputAliases = (() => {
  const aliases = new Set<string>(tarotCardNames);
  const numeralEntries = Object.entries(chineseNumerals);
  for (const { label } of minorSuits) {
    aliases.add(`${label}王牌`);
    aliases.add(`${label}Ace`);
    aliases.add(`${label}A`);
    aliases.add(`${label}Ａ`);
    for (const [numeral, value] of numeralEntries) {
      aliases.add(`${label}${numeral}`);
      aliases.add(`${label}${value.replace(/[0-9]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) + 65248))}`);
      if (label === "星幣") {
        aliases.add(`錢幣${numeral}`);
        aliases.add(`金幣${numeral}`);
        aliases.add(`錢幣${value}`);
        aliases.add(`金幣${value}`);
      }
    }
    for (const rank of ["侍者", "騎士", "皇后", "國王"]) {
      if (label === "星幣") {
        aliases.add(`錢幣${rank}`);
        aliases.add(`金幣${rank}`);
      }
    }
  }
  aliases.add("法王");
  aliases.add("女教皇");
  aliases.add("審判者");
  aliases.add("隱士");
  return [...aliases].sort((a, b) => b.length - a.length);
})();
