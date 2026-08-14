import { describe, expect, it } from "vitest";
import { generateCoinSide } from "./flipCoin";

describe("production orientation RNG QA", () => {
  it("keeps a 100,000-sample upright rate within the 48% to 52% smoke-test band", () => {
    const sampleSize = 100_000;
    let upright = 0;
    for (let index = 0; index < sampleSize; index += 1) {
      if (generateCoinSide() === "heads") upright += 1;
    }
    const uprightRate = upright / sampleSize;

    expect(uprightRate).toBeGreaterThanOrEqual(0.48);
    expect(uprightRate).toBeLessThanOrEqual(0.52);
  });
});
