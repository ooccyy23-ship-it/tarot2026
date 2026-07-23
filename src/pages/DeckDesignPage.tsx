import { useMemo, useState } from "react";
import { tarotDesignGuides, tarotDesignTokens } from "../data/tarotDesignGuides";

export function DeckDesignPage() {
  const [selectedId, setSelectedId] = useState(tarotDesignGuides[0]?.id ?? "");
  const activeGuide = useMemo(
    () => tarotDesignGuides.find((guide) => guide.id === selectedId) ?? tarotDesignGuides[0],
    [selectedId],
  );

  if (!activeGuide) return null;

  return (
    <main className="content-page">
      <header className="page-hero deck-guide-hero">
        <div>
          <p className="eyebrow">Tarot Design System</p>
          <h1>把牌卡設計稿整理成可供資料、UI 與詳情頁重用的設計系統。</h1>
          <p>這個 prototype 先收進 4 張聖杯宮廷牌的設計指南，讓之後擴充整副牌時有一致的資料格式與視覺 tokens。</p>
        </div>
      </header>

      <section className="panel deck-guide-token-panel">
        <div className="page-title">
          <div>
            <p className="eyebrow">Shared Tokens</p>
            <h1>共享設計 tokens</h1>
            <p>把字體、光感、邊框與色盤轉成前端可直接使用的設計基礎。</p>
          </div>
        </div>

        <div className="deck-token-grid">
          <article className="deck-token-card"><span>標題字體</span><strong>{tarotDesignTokens.titleFontFamily}</strong></article>
          <article className="deck-token-card"><span>內文字體</span><strong>{tarotDesignTokens.bodyFontFamily}</strong></article>
          <article className="deck-token-card"><span>裝飾風格</span><strong>{tarotDesignTokens.ornamentStyle}</strong></article>
          <article className="deck-token-card"><span>邊框風格</span><strong>{tarotDesignTokens.frameStyle}</strong></article>
          <article className="deck-token-card"><span>主體比例</span><strong>{tarotDesignTokens.illustrationRatio}</strong></article>
          <article className="deck-token-card"><span>光感方向</span><strong>{tarotDesignTokens.lightingDirection}</strong></article>
        </div>

        <div className="deck-palette-strip" aria-label="牌卡色盤">
          {tarotDesignTokens.palette.map((token) => (
            <div className="deck-palette-chip" key={token.name}>
              <div className="deck-palette-swatch" style={{ backgroundColor: token.hex }} />
              <strong>{token.name}</strong>
              <span>{token.hex}</span>
              <small>{token.usage}</small>
            </div>
          ))}
        </div>

        <div className="deck-token-notes">
          {tarotDesignTokens.uiSuggestions.map((note) => (
            <article className="deck-note-card" key={note}>
              <strong>UI 運用建議</strong>
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel deck-guide-panel">
        <div className="page-title">
          <div>
            <p className="eyebrow">Card Detail Prototype</p>
            <h1>牌卡詳情頁 prototype</h1>
            <p>點選不同牌卡，可查看其設計規範、情緒關鍵詞與 AI prompt 參考。</p>
          </div>
        </div>

        <div className="deck-guide-selector" role="tablist" aria-label="牌卡選擇">
          {tarotDesignGuides.map((guide) => (
            <button
              key={guide.id}
              className={`deck-guide-tab ${guide.id === activeGuide.id ? "is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={guide.id === activeGuide.id}
              onClick={() => setSelectedId(guide.id)}
            >
              <span>{guide.cardNameZh}</span>
              <small>{guide.cardNameEn}</small>
            </button>
          ))}
        </div>

        <div className="deck-guide-layout">
          <article className="deck-card-preview">
            <div className="deck-card-frame">
              <div className="deck-card-frame-top">
                <span>{activeGuide.suitLabel}宮廷牌</span>
                <span>{activeGuide.element}</span>
              </div>
              <div className="deck-card-illustration">
                <div className="deck-card-medallion">杯</div>
                <div className="deck-card-silhouette">
                  <span>{activeGuide.cardNameZh}</span>
                  <small>{activeGuide.rank.toUpperCase()}</small>
                </div>
              </div>
              <div className="deck-card-caption">
                <strong>{activeGuide.cardNameZh}</strong>
                <span>{activeGuide.cardNameEn}</span>
              </div>
            </div>
            <div className="deck-card-caption-notes">
              {activeGuide.designSpec.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>

          <div className="deck-guide-details">
            <section className="deck-guide-detail-card">
              <div className="deck-guide-detail-header">
                <div>
                  <p className="eyebrow">Guide Summary</p>
                  <h2>{activeGuide.cardNameZh}</h2>
                  <p>{activeGuide.cardNameEn}</p>
                </div>
                <div className="deck-guide-stamp">
                  <span>{activeGuide.suitLabel}</span>
                  <strong>{activeGuide.rank.toUpperCase()}</strong>
                </div>
              </div>
              <div className="deck-metadata-list">
                {activeGuide.cardMetadata.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="deck-guide-columns">
              <article className="deck-guide-detail-card">
                <h3>核心牌義</h3>
                <ul>{activeGuide.coreMeaning.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="deck-guide-detail-card">
                <h3>不可改變的核心元素</h3>
                <ul>{activeGuide.immutableElements.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="deck-guide-detail-card">
                <h3>可替換元素</h3>
                <ul>{activeGuide.flexibleElements.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="deck-guide-detail-card">
                <h3>禁止新增元素</h3>
                <ul>{activeGuide.forbiddenElements.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="deck-guide-detail-card">
                <h3>情緒與氛圍</h3>
                <div className="deck-keyword-list">
                  {activeGuide.moodKeywords.map((item) => <span key={item}>{item}</span>)}
                </div>
              </article>
              <article className="deck-guide-detail-card">
                <h3>構圖重點</h3>
                <ul>{activeGuide.compositionFocus.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="deck-guide-detail-card">
                <h3>象徵補充</h3>
                <ul>{activeGuide.symbolicReferences.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="deck-guide-detail-card">
                <h3>AI Prompt 參考</h3>
                <p className="deck-prompt-block">{activeGuide.promptReference}</p>
              </article>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
