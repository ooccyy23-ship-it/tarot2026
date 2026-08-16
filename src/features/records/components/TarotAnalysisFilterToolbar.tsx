import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { TarotRecordType } from "../types/tarotRecord";

type OpenPanel = "scope" | "date" | null;

type TarotAnalysisFilterToolbarProps = {
  dateFrom: string;
  dateTo: string;
  minimumDate: string;
  maximumDate: string;
  cardCount: number;
  groupCount: number;
  recordType: TarotRecordType | "";
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onRecordTypeChange: (value: TarotRecordType | "") => void;
  onReset: () => void;
};

function compactDate(value: string): string {
  const [, month = "", day = ""] = value.split("-");
  return month && day ? `${month}/${day}` : "—";
}

export function TarotAnalysisFilterToolbar({
  dateFrom,
  dateTo,
  minimumDate,
  maximumDate,
  cardCount,
  groupCount,
  recordType,
  onDateFromChange,
  onDateToChange,
  onRecordTypeChange,
  onReset,
}: TarotAnalysisFilterToolbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const updateHeight = () => setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsStuck(!entry.isIntersecting && entry.boundingClientRect.top <= headerHeight);
    }, { rootMargin: `-${headerHeight}px 0px 0px`, threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [headerHeight]);

  useEffect(() => {
    if (!openPanel) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenPanel(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openPanel]);

  const style = { "--analytics-sticky-top": `${headerHeight}px` } as CSSProperties;
  const dateLabel = `${compactDate(dateFrom)}–${compactDate(dateTo)}`;

  return (
    <>
      <div className="analytics-filter-sentinel" ref={sentinelRef} aria-hidden="true" />
      <div
        className={`analytics-filter-toolbar ${isStuck ? "is-stuck" : ""}`}
        ref={containerRef}
        style={style}
        aria-label="統計分析篩選工具列"
      >
        <div className="analytics-filter-control">
          <span>統計範圍</span>
          <button
            type="button"
            aria-expanded={openPanel === "scope"}
            aria-controls="analytics-scope-menu"
            onClick={() => setOpenPanel((current) => current === "scope" ? null : "scope")}
          >
            <strong className="analytics-filter-desktop-label">{recordType === "questioned" ? "題組觀測" : recordType === "open_observation" ? "無題觀測" : "全部正式紀錄"}</strong>
            <strong className="analytics-filter-mobile-label">{recordType === "questioned" ? "題組" : recordType === "open_observation" ? "無題" : "全部紀錄"}</strong>
            <i aria-hidden="true">⌄</i>
          </button>
          {openPanel === "scope" ? (
            <div className="analytics-filter-popover analytics-scope-popover" id="analytics-scope-menu" role="dialog" aria-label="統計資料範圍">
              <label><span>資料類型</span><select value={recordType} onChange={(event) => onRecordTypeChange(event.target.value as TarotRecordType | "")}><option value="">全部</option><option value="questioned">題組觀測</option><option value="open_observation">無題觀測</option></select></label>
              <p>舊紀錄會自動視為題組觀測；無題觀測不會產生題目資料。</p>
            </div>
          ) : null}
        </div>

        <div className="analytics-filter-control">
          <span>日期範圍</span>
          <button
            type="button"
            aria-expanded={openPanel === "date"}
            aria-controls="analytics-date-picker"
            onClick={() => setOpenPanel((current) => current === "date" ? null : "date")}
          >
            <strong>{dateLabel}</strong>
            <i aria-hidden="true">⌄</i>
          </button>
          {openPanel === "date" ? (
            <div className="analytics-filter-popover analytics-date-popover" id="analytics-date-picker" role="dialog" aria-label="選擇統計日期範圍">
              <label><span>開始日期</span><input type="date" min={minimumDate} max={maximumDate} value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} /></label>
              <label><span>結束日期</span><input type="date" min={minimumDate} max={maximumDate} value={dateTo} onChange={(event) => onDateToChange(event.target.value)} /></label>
              <div>
                <button className="ghost-button compact-button" type="button" onClick={onReset}>恢復全部日期</button>
                <button className="secondary-button compact-button" type="button" onClick={() => setOpenPanel(null)}>完成</button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="analytics-filter-count" aria-live="polite">
          <span>統計結果</span>
          <strong>{cardCount} 張牌 <b>／</b> {groupCount} 個題組</strong>
        </div>

        <button className="analytics-filter-reset" type="button" onClick={onReset}>重設</button>
      </div>
    </>
  );
}
