import { useState } from "react";
import { PageHeader } from "./components/ui/PageHeader";
import { FiveCardDrawModule } from "./features/draw/components/FiveCardDrawModule";
import { SingleCardDrawModule } from "./features/draw/components/SingleCardDrawModule";

type DrawMode = "five" | "single";

export default function App() {
  const [drawMode, setDrawMode] = useState<DrawMode>("five");
  const [fiveDrawInProgress, setFiveDrawInProgress] = useState(false);
  const [singleDrawInProgress, setSingleDrawInProgress] = useState(false);

  const changeDrawMode = (nextMode: DrawMode) => {
    if (nextMode === drawMode) return;
    const hasUnfinishedDraw = drawMode === "five" ? fiveDrawInProgress : singleDrawInProgress;
    if (hasUnfinishedDraw && !window.confirm("目前抽牌尚未完成，切換模式將離開目前操作。確定要繼續嗎？")) return;
    setDrawMode(nextMode);
  };

  return (
    <main className="app-shell">
      <PageHeader eyebrow="Tarot Draw Tool" title="抽牌工具" description={drawMode === "five" ? "先計算五個序號，再依序完成五次硬幣翻轉，最後揭示完整牌組與正逆位結果。" : "以抽牌時間計算一個序號，再依星期對照表取得牌卡並決定正逆位。"} />
      <section className="draw-mode-bar" aria-label="抽牌模式">
        <div className="draw-mode-tabs" role="tablist" aria-label="選擇抽牌模式">
          <button
            className={drawMode === "five" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={drawMode === "five"}
            onClick={() => changeDrawMode("five")}
          >
            五牌抽取
          </button>
          <button
            className={drawMode === "single" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={drawMode === "single"}
            onClick={() => changeDrawMode("single")}
          >
            單張抽牌
          </button>
        </div>
      </section>
      <div hidden={drawMode !== "five"}><FiveCardDrawModule isActive={drawMode === "five"} onProgressChange={setFiveDrawInProgress} /></div>
      <div hidden={drawMode !== "single"}><SingleCardDrawModule isActive={drawMode === "single"} onProgressChange={setSingleDrawInProgress} /></div>
    </main>
  );
}
