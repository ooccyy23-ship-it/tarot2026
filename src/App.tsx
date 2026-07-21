import { FiveCardDrawModule } from "./features/draw/components/FiveCardDrawModule";

export default function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Tarot Draw Tool</p>
        <h1>塔羅五牌抽取系統</h1>
        <p className="hero-copy">先計算五個序號，再依序完成五次硬幣翻轉，最後揭示完整牌組與正逆位結果。</p>
      </header>
      <FiveCardDrawModule />
    </main>
  );
}
