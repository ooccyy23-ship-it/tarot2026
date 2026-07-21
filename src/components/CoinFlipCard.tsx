import type { DrawCard } from "../types/tarot";

type CoinFlipCardProps = {
  card: DrawCard;
  canInteract: boolean;
  isFlipping: boolean;
  onStart: () => void;
  onStop: () => void;
};

export function CoinFlipCard({
  card,
  canInteract,
  isFlipping,
  onStart,
  onStop,
}: CoinFlipCardProps) {
  const locked = card.orientationResult?.locked ?? false;
  const resultLabel = locked
    ? card.orientationResult?.coinSide === "heads"
      ? "正面"
      : "反面"
    : isFlipping
      ? "翻轉中"
      : "尚未開始";

  return (
    <article className={`coin-card ${!canInteract && !locked ? "is-disabled" : ""}`}>
      <p className="coin-title">第{card.order}張牌</p>
      <p className="coin-sequence">序號 {card.formattedSequence}</p>

      <div className={`coin-visual ${isFlipping ? "is-flipping" : ""} ${locked ? "is-locked" : ""}`}>
        <span>{resultLabel}</span>
      </div>

      {locked ? (
        <div className="coin-meta">
          <span>{card.orientationResult?.orientation === "upright" ? "正位" : "逆位"}</span>
          <span>{card.orientationResult?.durationMs} ms</span>
        </div>
      ) : null}

      <button
        className="secondary-button"
        type="button"
        disabled={!canInteract && !isFlipping}
        onClick={isFlipping ? onStop : onStart}
      >
        {isFlipping ? "停止" : "開始翻轉"}
      </button>
    </article>
  );
}
