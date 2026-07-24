import { useEffect, useMemo, useState } from "react";
import { getResearchVerificationResultLabel } from "../constants/researchSessionLabels";
import {
  canCompleteResearchSession,
  getMissingValidationQuestions,
  researchValidationStatuses,
  summarizeQuestionGroupValidation,
  summarizeSessionValidation,
  type ResearchQuestionValidationInput,
} from "../logic/researchSessionValidation";
import type {
  ResearchEventRecord,
  ResearchQuestionValidationRecord,
  ResearchSession,
  ResearchSetCode,
  ResearchVerificationResult,
} from "../types/researchSession";

type Props = {
  session: ResearchSession;
  events: ResearchEventRecord[];
  validations: ResearchQuestionValidationRecord[];
  saving: boolean;
  onSave: (
    setId: ResearchSetCode,
    questionIndex: number,
    input: ResearchQuestionValidationInput,
  ) => Promise<void>;
  onComplete: () => Promise<void>;
};

type Draft = {
  validationStatus: ResearchVerificationResult | "";
  evidence: string;
  note: string;
};

function draftKey(setId: ResearchSetCode, questionIndex: number): string {
  return `${setId}-${questionIndex}`;
}

function formatRate(rate: number | null): string {
  return rate === null ? "無有效題目" : `${Number((rate * 100).toFixed(2))}%`;
}

function eventOccurredAt(event: ResearchEventRecord): string {
  return `${event.eventDate}${event.eventTime ? ` ${event.eventTime}` : ""}`;
}

export function ResearchValidationSection({
  session,
  events,
  validations,
  saving,
  onSave,
  onComplete,
}: Props) {
  const editable = session.status === "validation_due";
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const restored = Object.fromEntries(validations.map((record) => [
      draftKey(record.setId, record.questionIndex),
      {
        validationStatus: record.validationStatus,
        evidence: record.evidence,
        note: record.note ?? "",
      } satisfies Draft,
    ]));
    setDrafts(restored);
  }, [validations]);

  const setSummaries = useMemo(() => session.groupDrawResults.map((setResult) => ({
    setResult,
    summary: summarizeQuestionGroupValidation(setResult, validations),
  })), [session.groupDrawResults, validations]);
  const overallSummary = useMemo(
    () => summarizeSessionValidation(session.groupDrawResults, validations),
    [session.groupDrawResults, validations],
  );
  const missing = useMemo(
    () => getMissingValidationQuestions(session.groupDrawResults, validations),
    [session.groupDrawResults, validations],
  );
  const canComplete = canCompleteResearchSession(
    session,
    session.groupDrawResults,
    validations,
  );

  const updateDraft = (key: string, patch: Partial<Draft>) => {
    setDrafts((current) => {
      const existing = current[key] ?? {
        validationStatus: "",
        evidence: "",
        note: "",
      };
      return {
        ...current,
        [key]: {
          ...existing,
          ...patch,
        },
      };
    });
    setLocalErrors((current) => ({ ...current, [key]: "" }));
  };

  const saveQuestion = async (
    setId: ResearchSetCode,
    questionIndex: number,
  ) => {
    const key = draftKey(setId, questionIndex);
    const draft = drafts[key];
    if (!draft?.validationStatus) {
      setLocalErrors((current) => ({ ...current, [key]: "請選擇驗證結果。" }));
      return;
    }
    if (!draft.evidence.trim()) {
      setLocalErrors((current) => ({ ...current, [key]: "驗證依據為必填。" }));
      return;
    }
    try {
      await onSave(setId, questionIndex, {
        validationStatus: draft.validationStatus,
        evidence: draft.evidence,
        note: draft.note,
      });
    } catch {
      // Firestore 錯誤由頁面統一顯示，草稿保留供重試。
    }
  };

  return (
    <section className="research-validation-section">
      <div className="panel research-validation-header">
        <div>
          <p className="eyebrow">Final validation</p>
          <h2>7 天研究最終驗證</h2>
          <p>逐題核對牌卡預測與現實事件；驗證依據為必填。</p>
        </div>
        <span className={`status-chip ${editable ? "validation_due" : "completed"}`}>
          {editable ? "待驗證" : "已完成・唯讀"}
        </span>
      </div>

      <div className="research-validation-summaries research-validation-summaries-top" aria-label="命中率摘要">
        {setSummaries.map(({ setResult, summary }) => (
          <article className="panel" key={setResult.setId}>
            <strong>題組 {setResult.setId}</strong>
            <span>得分 {summary.score}</span>
            <span>有效題數 {summary.validQuestionCount}</span>
            <b>{formatRate(summary.hitRate)}</b>
          </article>
        ))}
        <article className="panel overall">
          <strong>整體 Session</strong>
          <span>得分 {overallSummary.score}</span>
          <span>有效題數 {overallSummary.validQuestionCount}</span>
          <b>{formatRate(overallSummary.hitRate)}</b>
        </article>
      </div>

      {session.groupDrawResults.map((setResult) => (
        <section className="research-validation-set" key={setResult.setId}>
          <div className="section-heading">
            <p className="eyebrow">題組 {setResult.setId}</p>
            <h2>{setResult.setName}</h2>
          </div>
          <p className="research-validation-sequences">
            五序號：{setResult.sequences.join("、")}
          </p>

          <div className="research-validation-question-list">
            {setResult.cards.map((card) => {
              const key = draftKey(setResult.setId, card.questionIndex);
              const draft = drafts[key] ?? {
                validationStatus: "",
                evidence: "",
                note: "",
              };
              const stored = validations.find(
                (item) => item.setId === setResult.setId
                  && item.questionIndex === card.questionIndex,
              );
              const relatedEvents = events.filter((event) => (
                event.relatedQuestionIds.includes(card.questionId)
                || (
                  event.relatedSets.includes(setResult.setId)
                  && event.relatedQuestionIds.length === 0
                )
              ));
              return (
                <article className="panel research-validation-question" key={key}>
                  <div className="research-validation-card-info">
                    <img src={card.imageUrl} alt={`${card.cardNameZh}${card.orientationLabel}`} />
                    <div>
                      <p className="eyebrow">第 {card.questionIndex} 題</p>
                      <h3>{card.questionText}</h3>
                      <p>
                        {card.cardNameZh}
                        {card.cardNameEn ? `・${card.cardNameEn}` : ""}
                        ・{card.orientationLabel}
                      </p>
                      <p>對應序號：{card.sequence}</p>
                    </div>
                  </div>

                  <div className="research-validation-events">
                    <strong>相關現實事件</strong>
                    {relatedEvents.length > 0 ? (
                      <ul>
                        {relatedEvents.map((event) => (
                          <li key={event.eventId}>
                            <span>{eventOccurredAt(event)}・{event.eventType}</span>
                            <p>{event.description}</p>
                          </li>
                        ))}
                      </ul>
                    ) : <p>尚無直接關聯事件。</p>}
                  </div>

                  <div className="research-validation-form">
                    <label className="field-group">
                      <span className="field-label">驗證結果</span>
                      <select
                        className="text-input"
                        value={draft.validationStatus}
                        disabled={!editable || saving}
                        onChange={(event) => updateDraft(key, {
                          validationStatus: event.target.value as ResearchVerificationResult,
                        })}
                      >
                        <option value="">請選擇</option>
                        {researchValidationStatuses.map((status) => (
                          <option key={status} value={status}>
                            {getResearchVerificationResultLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field-group">
                      <span className="field-label">驗證依據（必填）</span>
                      <textarea
                        className="text-area"
                        rows={4}
                        value={draft.evidence}
                        disabled={!editable || saving}
                        onChange={(event) => updateDraft(key, { evidence: event.target.value })}
                      />
                    </label>
                    <label className="field-group">
                      <span className="field-label">備註</span>
                      <textarea
                        className="text-area"
                        rows={3}
                        value={draft.note}
                        disabled={!editable || saving}
                        onChange={(event) => updateDraft(key, { note: event.target.value })}
                      />
                    </label>
                    {localErrors[key] ? <p className="field-error">{localErrors[key]}</p> : null}
                    {editable ? (
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={saving}
                        onClick={() => void saveQuestion(
                          setResult.setId,
                          card.questionIndex,
                        )}
                      >
                        {stored ? "更新本題驗證" : "儲存本題驗證"}
                      </button>
                    ) : (
                      <p className="readonly-note">本題驗證已鎖定為唯讀。</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="research-validation-score-section">
        <div className="section-heading">
          <p className="eyebrow">Accuracy summary</p>
          <h2>命中率摘要</h2>
        </div>
        <div className="research-validation-summaries" aria-label="命中率摘要">
          {setSummaries.map(({ setResult, summary }) => (
            <article className="panel" key={setResult.setId}>
              <strong>題組 {setResult.setId}</strong>
              <span>得分 {summary.score}</span>
              <span>有效題數 {summary.validQuestionCount}</span>
              <b>{formatRate(summary.hitRate)}</b>
            </article>
          ))}
          <article className="panel overall">
            <strong>整體 Session</strong>
            <span>得分 {overallSummary.score}</span>
            <span>有效題數 {overallSummary.validQuestionCount}</span>
            <b>{formatRate(overallSummary.hitRate)}</b>
          </article>
        </div>
      </section>

      <section className="panel research-validation-completion">
        <div>
          <h2>完成本次研究</h2>
          {missing.length > 0 ? (
            <>
              <p>尚缺少 {missing.length} 題：</p>
              <p className="missing-validation-list">{missing.join("、")}</p>
            </>
          ) : (
            <p>15 題皆已儲存，可完成並永久鎖定本次研究。</p>
          )}
        </div>
        {editable ? (
          <button
            className="primary-button"
            type="button"
            disabled={saving || !canComplete}
            onClick={() => {
              if (window.confirm("完成後抽牌、事件與驗證將全部變成唯讀，且不可重新開啟。確認完成嗎？")) {
                void onComplete().catch(() => undefined);
              }
            }}
          >
            完成本次研究
          </button>
        ) : <span className="status-chip completed">已完成</span>}
      </section>
    </section>
  );
}
