import { describe, expect, it } from "vitest";
import { finalizeCoinFlip, generateCoinSide } from "./flipCoin";

function createCryptoMock(value: number) {
  return {
    getRandomValues: (array: Uint32Array) => {
      array[0] = value;
      return array;
    },
  };
}

describe("flipCoin", () => {
  it("coin results should only be heads or tails", () => {
    expect(generateCoinSide(createCryptoMock(2))).toBe("heads");
    expect(generateCoinSide(createCryptoMock(3))).toBe("tails");
  });

  it("locked result should not generate a new orientation again", () => {
    const firstResult = finalizeCoinFlip(
      "2026-07-21T09:00:00.000Z",
      null,
      createCryptoMock(2),
      "2026-07-21T09:00:01.000Z",
    );

    const secondResult = finalizeCoinFlip(
      "2026-07-21T09:00:00.000Z",
      firstResult,
      createCryptoMock(3),
      "2026-07-21T09:00:02.000Z",
    );

    expect(firstResult.coinSide).toBe("heads");
    expect(firstResult.orientation).toBe("upright");
    expect(secondResult).toBe(firstResult);
    expect(secondResult.coinSide).toBe("heads");
  });

  it("stop timing does not affect the result logic when the random source is the same", () => {
    const shortDuration = finalizeCoinFlip(
      "2026-07-23T10:00:00.000Z",
      null,
      createCryptoMock(2),
      "2026-07-23T10:00:01.000Z",
    );

    const longDuration = finalizeCoinFlip(
      "2026-07-23T10:00:00.000Z",
      null,
      createCryptoMock(2),
      "2026-07-23T10:00:08.000Z",
    );

    expect(shortDuration.coinSide).toBe("heads");
    expect(longDuration.coinSide).toBe("heads");
    expect(shortDuration.orientation).toBe("upright");
    expect(longDuration.orientation).toBe("upright");
    expect(shortDuration.durationMs).toBe(1000);
    expect(longDuration.durationMs).toBe(8000);
  });
});
