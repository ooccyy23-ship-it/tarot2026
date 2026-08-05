import { useState } from "react";
import { FiveCardDrawModule } from "./features/draw/components/FiveCardDrawModule";
import { SingleCardDrawModule } from "./features/draw/components/SingleCardDrawModule";

type DrawMode = "five" | "single";

export default function App() {
  const [drawMode, setDrawMode] = useState<DrawMode>("five");

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Tarot Draw Tool</p>
        <h1>塔羅抽牌系統</h1>
        <p className="hero-copy">
          {drawMode === "five"
            ? "先計算五個序號，再依序完成五次硬幣翻轉，最後揭示完整牌組與正逆位結果。"
            : "以抽牌時間計算一個序號，再依星期對照表取得牌卡並決定正逆位。"}
        </p>
        <div className="draw-mode-tabs" role="tablist" aria-label="選擇抽牌模式">
          <button
            className={drawMode === "five" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={drawMode === "five"}
            onClick={() => setDrawMode("five")}
          >
            五牌抽取
          </button>
          <button
            className={drawMode === "single" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={drawMode === "single"}
            onClick={() => setDrawMode("single")}
          >
            單張抽牌
          </button>
        </div>
      </header>
      <div hidden={drawMode !== "five"}><FiveCardDrawModule /></div>
      <div hidden={drawMode !== "single"}><SingleCardDrawModule /></div>
    </main>
  );
}
