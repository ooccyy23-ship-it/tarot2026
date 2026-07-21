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
});
