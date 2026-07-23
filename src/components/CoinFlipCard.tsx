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
      : "?";
  const actionLabel = isFlipping ? "停止抽牌" : "開始抽牌";
  const orientationLabel = card.orientationResult?.orientation === "upright" ? "正位" : "逆位";

  return (
    <article className={`coin-card ${!canInteract && !locked ? "is-disabled" : ""}`}>
      <div className="coin-card-header">
        <p className="coin-title">第{card.order}張牌</p>
        <p className="coin-sequence">序號 {card.formattedSequence}</p>
      </div>

      <div className={`coin-visual ${isFlipping ? "is-flipping" : ""} ${locked ? "is-locked" : ""}`}>
        <span>{resultLabel}</span>
      </div>

      {locked ? (
        <div className="coin-meta">
          <span>{orientationLabel}</span>
          <span>{card.orientationResult?.coinSide === "heads" ? "正面" : "反面"}</span>
        </div>
      ) : null}

      <button
        className="secondary-button coin-action-button"
        type="button"
        disabled={!canInteract && !isFlipping}
        onClick={isFlipping ? onStop : onStart}
      >
        {actionLabel}
      </button>
    </article>
  );
}
