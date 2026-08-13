import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TarotCooccurrencePartnersSection } from "./TarotCooccurrencePartnersSection";

describe("TarotCooccurrencePartnersSection", () => {
  it("starts without a selected card and renders all 78 stable card options", () => {
    const html = renderToStaticMarkup(
      <TarotCooccurrencePartnersSection
        records={[]}
        selectedCardId=""
        minimumCount={1}
        dateFrom="2026-08-01"
        dateTo="2026-08-14"
        onSelectedCardChange={() => undefined}
      />,
    );

    expect(html).toContain("請先選擇一張牌。");
    expect(html.match(/<option/g)).toHaveLength(79);
    expect(html).toContain('value="TAROT_00"');
    expect(html).toContain('value="TAROT_77"');
  });
});
