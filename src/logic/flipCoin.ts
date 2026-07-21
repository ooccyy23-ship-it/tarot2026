import type { OrientationResult } from "../types/tarot";

export type CryptoLike = {
  getRandomValues: (array: Uint32Array) => Uint32Array;
};

export function getCryptoProvider(): CryptoLike {
  const provider = globalThis.crypto;

  if (!provider?.getRandomValues) {
    throw new Error("目前環境不支援 crypto.getRandomValues()");
  }

  return provider;
}

export function generateCoinSide(cryptoProvider: CryptoLike = getCryptoProvider()): "heads" | "tails" {
  const buffer = new Uint32Array(1);
  cryptoProvider.getRandomValues(buffer);

  return buffer[0] % 2 === 0 ? "heads" : "tails";
}

export function resolveOrientation(
  side: "heads" | "tails",
): "upright" | "reversed" {
  return side === "heads" ? "upright" : "reversed";
}

export function finalizeCoinFlip(
  startedAt: string,
  existing: OrientationResult | null,
  cryptoProvider: CryptoLike = getCryptoProvider(),
  stoppedAt = new Date().toISOString(),
): OrientationResult {
  if (existing?.locked) {
    return existing;
  }

  const coinSide = generateCoinSide(cryptoProvider);
  const durationMs = Math.max(0, new Date(stoppedAt).getTime() - new Date(startedAt).getTime());

  return {
    coinSide,
    orientation: resolveOrientation(coinSide),
    startedAt,
    stoppedAt,
    durationMs,
    locked: true,
  };
}
