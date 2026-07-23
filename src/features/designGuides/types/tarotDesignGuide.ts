export type TarotPaletteToken = {
  name: string;
  hex: string;
  usage: string;
};

export type TarotDesignTokens = {
  titleFontFamily: string;
  bodyFontFamily: string;
  ornamentStyle: string;
  frameStyle: string;
  illustrationRatio: string;
  lightingDirection: string;
  textureKeywords: string[];
  palette: TarotPaletteToken[];
  uiSuggestions: string[];
};

export type TarotDesignGuide = {
  id: string;
  cardNameZh: string;
  cardNameEn: string;
  suit: string;
  suitLabel: string;
  rank: string;
  arcana: "minor";
  element: string;
  guideVersion: string;
  createdDate: string;
  coreMeaning: string[];
  immutableElements: string[];
  flexibleElements: string[];
  forbiddenElements: string[];
  palette: TarotPaletteToken[];
  moodKeywords: string[];
  compositionFocus: string[];
  symbolicReferences: string[];
  promptReference: string;
  designSpec: string[];
  cardMetadata: Array<{ label: string; value: string }>;
};
