import { useMemo, useRef, useState } from "react";
import { tarotCardNames } from "../data/tarotCardCatalog";
import { formatDateForDisplay } from "../features/records/parser/observationDateTime";
import {
  parseTarotRecordDraft,
  updateDraftCardName,
  validateParsedTarotGroup,
} from "../features/records/parser/parseTarotRecord";
import type {
  ParsedTarotGroupDraft,
  ParsedTarotRecordDraft,
  TarotOrientationLabel,
  TarotRecordParseIssue,
} from "../features/records/types/tarotRecord";

const arcanaLabels = { major: "大阿爾克那", minor: "小阿爾克那" } as const;
const suitLabels = {
  major: "大阿爾克那",
  cups: "聖杯",
  swords: "寶劍",
  wands: "權杖",
  pentacles: "星幣",
} as const;

export function TarotRecordsPage() {
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<ParsedTarotGroupDraft | null>(null);
  const [parseIssues, setParseIssues] = useState<TarotRecordParseIssue[]>([]);
  const [notice, setNotice] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const validationIssues = useMemo(() => {
    if (!draft) return parseIssues;
    const rowIssues = draft.records.flatMap((record) => record.issues);
    return [...parseIssues, ...rowIssues, ...validateParsedTarotGroup(draft)]
      .filter((issue, index, all) => all.findIndex((candidate) => candidate.message === issue.message) === index);
  }, [draft, parseIssues]);

  const handleParse = () => {
    setNotice("");
    const result = parseTarotRecordDraft(input);
    setDraft(result.group);
    setParseIssues(result.issues.filter((issue) => issue.questionOrder === undefined));
    if (!result.group) return;
    setNotice(result.issues.length === 0 ? "解析成功，共5筆資料。" : "已建立預覽，請修正標記的資料後再繼續。");
  };

  const clearInput = () => {
    if (input.trim() && !window.confirm("確定要清空目前貼上的抽牌紀錄嗎？")) return;
    setInput("");
    setDraft(null);
    setParseIssues([]);
    setNotice("");
    textareaRef.current?.focus();
  };

  const updateRecord = (questionOrder: number, updater: (record: ParsedTarotRecordDraft) => ParsedTarotRecordDraft) => {
    setDraft((current) => current ? {
      ...current,
      records: current.records.map((record) => record.questionOrder === questionOrder ? updater(record) : record),
    } : current);
  };

  const updateOrientation = (record: ParsedTarotRecordDraft, label: TarotOrientationLabel): ParsedTarotRecordDraft => ({
    ...record,
    orientationLabel: label,
    orientation: label === "正位" ? "upright" : "reversed",
    issues: record.issues.filter((issue) => issue.code !== "missing_orientation"),
  });

  const returnToInput = () => {
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    textareaRef.current?.focus();
  };

  return (
    <main className="content-page records-page">
      <header className="page-title records-page-title">
        <div>
          <p className="eyebrow">Tarot Records</p>
          <h1>抽牌紀錄匯入</h1>
          <p>貼上完整五題抽牌紀錄，系統會自動辨識題組、題目、牌卡、正逆位及日期時間。</p>
        </div>
        <span className="status-chip pending">第一階段</span>
      </header>

      <section className="panel records-import-panel" aria-labelledby="records-import-title">
        <div className="section-heading">
          <div><p className="eyebrow">01 · 貼上紀錄</p><h2 id="records-import-title">貼上完整五題紀錄</h2></div>
        </div>
        <label className="records-input-label" htmlFor="tarot-record-input">抽牌紀錄文字</label>
        <textarea
          ref={textareaRef}
          id="tarot-record-input"
          className="records-import-textarea"
          value={input}
          placeholder="請貼上五題抽牌紀錄……"
          onChange={(event) => setInput(event.target.value)}
        />
        <div className="actions-row records-import-actions">
          <button className="primary-button" type="button" disabled={!input.trim()} onClick={handleParse}>解析紀錄</button>
          <button className="ghost-button" type="button" disabled={!input && !draft} onClick={clearInput}>清空內容</button>
        </div>
      </section>

      <section className="panel records-preview-panel" aria-labelledby="records-preview-title">
        <div className="section-heading">
          <div><p className="eyebrow">02 · 解析預覽</p><h2 id="records-preview-title">確認辨識結果</h2></div>
          {draft ? <span className={`status-chip ${validationIssues.length === 0 ? "verified" : "overdue"}`}>{validationIssues.length === 0 ? "解析成功" : "需要修正"}</span> : null}
        </div>

        {!draft ? (
          <>
            {parseIssues.length > 0 ? (
              <div className="records-error-list" role="alert">
                <strong>無法建立預覽：</strong>
                <ul>{parseIssues.map((issue) => <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>)}</ul>
              </div>
            ) : null}
            <div className="records-placeholder">
              <strong>尚未解析紀錄</strong>
              <p>貼上內容並按下「解析紀錄」後，五筆資料會顯示在這裡。</p>
            </div>
          </>
        ) : (
          <>
            <div className="records-preview-summary">
              <div><span>題組</span><strong>{draft.groupTitle}</strong></div>
              <div><span>日期</span><strong>{formatDateForDisplay(draft.observationDate)}</strong></div>
              <div><span>時間</span><strong>{draft.observationTime}</strong></div>
              <div><span>資料筆數</span><strong>{draft.records.length} 筆</strong></div>
            </div>

            {notice ? <p className={`status-message ${validationIssues.length === 0 ? "success" : "info"}`} role="status">{notice}</p> : null}
            {validationIssues.length > 0 ? (
              <div className="records-error-list" role="alert">
                <strong>請修正以下問題：</strong>
                <ul>{validationIssues.map((issue) => <li key={`${issue.code}-${issue.questionOrder ?? "group"}-${issue.message}`}>{issue.message}</li>)}</ul>
              </div>
            ) : null}

            <div className="records-preview-table-wrap">
              <table className="records-preview-table">
                <thead><tr><th>題序</th><th>題目</th><th>牌卡</th><th>正逆位</th><th>牌類</th><th>牌組</th><th>狀態</th></tr></thead>
                <tbody>
                  {draft.records.map((record) => {
                    const rowHasError = record.issues.length > 0 || !record.questionText.trim() || !record.normalizedCardName;
                    return (
                      <tr key={record.id} className={rowHasError ? "has-error" : ""}>
                        <td data-label="題序"><strong>{record.questionOrder}</strong></td>
                        <td data-label="題目">
                          <textarea
                            aria-label={`第${record.questionOrder}題題目`}
                            value={record.questionText}
                            onChange={(event) => updateRecord(record.questionOrder, (current) => ({ ...current, questionText: event.target.value }))}
                          />
                        </td>
                        <td data-label="牌卡">
                          <input
                            aria-label={`第${record.questionOrder}題牌卡`}
                            list="tarot-card-name-options"
                            value={record.cardName}
                            onChange={(event) => updateRecord(record.questionOrder, (current) => updateDraftCardName(current, event.target.value))}
                          />
                        </td>
                        <td data-label="正逆位">
                          <select
                            aria-label={`第${record.questionOrder}題正逆位`}
                            value={record.issues.some((issue) => issue.code === "missing_orientation") ? "" : record.orientationLabel}
                            onChange={(event) => updateRecord(record.questionOrder, (current) => updateOrientation(current, event.target.value as TarotOrientationLabel))}
                          >
                            <option value="" disabled>請選擇</option>
                            <option value="正位">正位</option>
                            <option value="逆位">逆位</option>
                          </select>
                        </td>
                        <td data-label="牌類">{record.arcanaType ? arcanaLabels[record.arcanaType] : "—"}</td>
                        <td data-label="牌組">{record.suit ? suitLabels[record.suit] : "—"}</td>
                        <td data-label="狀態"><span className={`records-row-status ${rowHasError ? "error" : "valid"}`}>{rowHasError ? "需修正" : "有效"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <datalist id="tarot-card-name-options">{tarotCardNames.map((name) => <option key={name} value={name} />)}</datalist>

            <div className="actions-row records-preview-actions">
              <button className="primary-button" type="button" disabled title="Firestore 儲存將於第二階段開放">確認儲存5筆資料（第二階段開放）</button>
              <button className="secondary-button" type="button" onClick={returnToInput}>返回修改</button>
              <button className="ghost-button" type="button" onClick={() => { setDraft(null); setParseIssues([]); setNotice(""); }}>取消解析</button>
            </div>
          </>
        )}
      </section>

      <section className="panel records-future-panel" aria-labelledby="records-table-title">
        <div><p className="eyebrow">03 · 抽牌資料表</p><h2 id="records-table-title">已儲存抽牌資料</h2><p>Firestore 儲存、搜尋、篩選與刪除功能將於第二階段完成。</p></div>
        <span className="status-chip pending">尚未開放</span>
      </section>

      <section className="panel records-future-panel" aria-labelledby="records-statistics-title">
        <div><p className="eyebrow">04 · 牌卡統計</p><h2 id="records-statistics-title">牌卡出現頻率</h2><p>排行榜、78張頻率表、圖表與 CSV 匯出將於第三階段完成。</p></div>
        <span className="status-chip pending">尚未開放</span>
      </section>
    </main>
  );
}
