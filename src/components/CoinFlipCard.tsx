import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRotateLeft, faCheck, faCompass } from "@fortawesome/free-solid-svg-icons";
import { useEffect } from "react";
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
  const orientationLabel = card.orientationResult?.orientation === "upright" ? "正位" : "逆位";
  const cardStateClass = locked
    ? card.orientationResult?.orientation === "upright"
      ? "is-completed is-upright"
      : "is-completed is-reversed"
    : canInteract
      ? "is-ready"
      : "is-disabled";

  useEffect(() => {
    if (!isFlipping) return;
    const timer = window.setTimeout(onStop, 1000);
    return () => window.clearTimeout(timer);
  }, [isFlipping, onStop]);

  return (
    <article className={`coin-card ${cardStateClass}`}>
      <div className="coin-card-header">
        <p className="coin-title">第{card.order}張牌</p>
      </div>

      <div
        className={`coin-visual ${isFlipping ? "is-flipping" : ""} ${locked ? "is-locked" : ""}`}
        aria-hidden="true"
      >
        <FontAwesomeIcon
          icon={locked
            ? card.orientationResult?.orientation === "upright"
              ? faCheck
              : faArrowRotateLeft
            : faCompass}
        />
      </div>

      <p className="coin-status" aria-live="polite">
        {locked ? (
          <strong>{card.orientationResult?.orientation === "upright" ? "✓ 正位" : "↺ 逆位"}</strong>
        ) : isFlipping ? "抽牌中" : "等待抽牌"}
      </p>

      <div className="coin-action-slot">
        {!locked && !isFlipping ? (
          <button
            className="secondary-button coin-action-button"
            type="button"
            disabled={!canInteract}
            onClick={onStart}
          >
            開始
          </button>
        ) : locked ? <span className="coin-orientation-label">{orientationLabel}</span> : null}
      </div>
    </article>
  );
}
