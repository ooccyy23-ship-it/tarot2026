import { useMemo, useState } from "react";
import { StatusMessage } from "../../../components/StatusMessage";
import {
  canEditResearchEvents,
  normalizeResearchEventInput,
  researchEventTypes,
  validateResearchEventInput,
  type ResearchEventInput,
} from "../logic/researchSessionEvents";
import {
  getResearchSetConfig,
  materializeResearchQuestions,
} from "../logic/researchSessionDraw";
import type {
  ResearchEventRecord,
  ResearchSession,
  ResearchSetCode,
} from "../types/researchSession";

const setIds: readonly ResearchSetCode[] = ["A", "B", "C"];

function emptyInput(session: ResearchSession): ResearchEventInput {
  const today = new Date();
  const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return {
    eventDate: localDate < session.startDate
      ? session.startDate
      : localDate > session.validationDeadline
        ? session.validationDeadline
        : localDate,
    eventTime: "",
    eventType: "直接訊息",
    description: "",
    isDirectInteraction: false,
    initiatedByXiaofeng: false,
    hasConcreteAction: false,
    relatedSets: [],
    relatedQuestionIds: [],
  };
}

function eventToInput(event: ResearchEventRecord): ResearchEventInput {
  return {
    eventDate: event.eventDate,
    eventTime: event.eventTime ?? "",
    eventType: event.eventType,
    description: event.description,
    isDirectInteraction: event.isDirectInteraction,
    initiatedByXiaofeng: event.initiatedByXiaofeng,
    hasConcreteAction: event.hasConcreteAction,
    relatedSets: [...event.relatedSets],
    relatedQuestionIds: [...event.relatedQuestionIds],
  };
}

type Props = {
  session: ResearchSession;
  events: ResearchEventRecord[];
  saving: boolean;
  onSave: (input: ResearchEventInput, eventId?: string) => Promise<void>;
};

export function ResearchEventSection({ session, events, saving, onSave }: Props) {
  const editable = canEditResearchEvents(session.status);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string>();
  const [input, setInput] = useState<ResearchEventInput>(() => emptyInput(session));
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const questionOptions = useMemo(() => setIds.flatMap((setId) => {
    const config = getResearchSetConfig(setId);
    return materializeResearchQuestions(config).map((question) => ({
      setId,
      questionId: question.id,
      label: `${setId}${question.order}｜${question.title}`,
    }));
  }), []);
  const questionLabel = useMemo(
    () => new Map(questionOptions.map((question) => [question.questionId, question.label])),
    [questionOptions],
  );

  const openCreate = () => {
    setEditingEventId(undefined);
    setInput(emptyInput(session));
    setFormErrors([]);
    setFormOpen(true);
  };

  const openEdit = (event: ResearchEventRecord) => {
    setEditingEventId(event.eventId);
    setInput(eventToInput(event));
    setFormErrors([]);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingEventId(undefined);
    setFormErrors([]);
  };

  const handleSubmit = async () => {
    const normalized = normalizeResearchEventInput(input);
    const errors = validateResearchEventInput(session, normalized);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    try {
      await onSave(normalized, editingEventId);
      closeForm();
    } catch {
      // 上層統一顯示 Firestore 錯誤，並保留表單內容供使用者重試。
    }
  };

  return (
    <section className="panel research-events-section">
      <div className="research-events-heading">
        <div className="section-heading">
          <p className="eyebrow">Reality Log</p>
          <h2>現實事件紀錄</h2>
          <p className="section-description">
            研究期間：{session.startDate} 至 {session.validationDeadline}
          </p>
        </div>
        {editable && !formOpen ? (
          <button className="primary-button" type="button" disabled={saving} onClick={openCreate}>
            ＋新增事件
          </button>
        ) : null}
      </div>

      {!editable ? (
        <StatusMessage tone="info" message="此 Session 已進入唯讀狀態，事件僅供查看。" />
      ) : null}

      {formOpen ? (
        <div className="research-event-form">
          <div className="event-form-grid">
            <label className="field-group">
              <span className="field-label">日期</span>
              <input
                className="text-input"
                type="date"
                min={session.startDate}
                max={session.validationDeadline}
                value={input.eventDate}
                onChange={(event) => setInput((current) => ({ ...current, eventDate: event.target.value }))}
              />
            </label>
            <label className="field-group">
              <span className="field-label">時間（選填）</span>
              <input
                className="text-input"
                type="time"
                value={input.eventTime ?? ""}
                onChange={(event) => setInput((current) => ({ ...current, eventTime: event.target.value }))}
              />
            </label>
            <label className="field-group event-type-field">
              <span className="field-label">事件類型</span>
              <select
                className="select-input"
                value={input.eventType}
                onChange={(event) => {
                  const eventType = event.target.value as ResearchEventInput["eventType"];
                  setInput((current) => ({
                    ...current,
                    eventType,
                    ...(eventType === "無互動紀錄"
                      ? {
                        isDirectInteraction: false,
                        initiatedByXiaofeng: false,
                        hasConcreteAction: false,
                      }
                      : {}),
                  }));
                }}
              >
                {researchEventTypes.map((eventType) => <option key={eventType}>{eventType}</option>)}
              </select>
            </label>
          </div>

          <label className="field-group">
            <span className="field-label">事件內容</span>
            <textarea
              className="text-area"
              rows={4}
              value={input.description}
              onChange={(event) => setInput((current) => ({ ...current, description: event.target.value }))}
              placeholder="只記錄可觀察到的現實事件。"
            />
          </label>

          <fieldset className="event-checkbox-group" disabled={input.eventType === "無互動紀錄"}>
            <legend>事件判定</legend>
            <label><input type="checkbox" checked={input.initiatedByXiaofeng} onChange={(event) => setInput((current) => ({ ...current, initiatedByXiaofeng: event.target.checked }))} />小峰主動</label>
            <label><input type="checkbox" checked={input.isDirectInteraction} onChange={(event) => setInput((current) => ({ ...current, isDirectInteraction: event.target.checked }))} />直接互動</label>
            <label><input type="checkbox" checked={input.hasConcreteAction} onChange={(event) => setInput((current) => ({ ...current, hasConcreteAction: event.target.checked }))} />有具體行動</label>
          </fieldset>

          <fieldset className="event-checkbox-group">
            <legend>關聯題組（可複選）</legend>
            {setIds.map((setId) => (
              <label key={setId}>
                <input
                  type="checkbox"
                  checked={input.relatedSets.includes(setId)}
                  onChange={(event) => setInput((current) => ({
                    ...current,
                    relatedSets: event.target.checked
                      ? [...current.relatedSets, setId]
                      : current.relatedSets.filter((item) => item !== setId),
                    relatedQuestionIds: event.target.checked
                      ? current.relatedQuestionIds
                      : current.relatedQuestionIds.filter((questionId) => (
                        !questionOptions.some((option) => option.setId === setId && option.questionId === questionId)
                      )),
                  }))}
                />
                題組 {setId}
              </label>
            ))}
          </fieldset>

          {input.relatedSets.length > 0 ? (
            <fieldset className="event-question-options">
              <legend>關聯題號（可複選）</legend>
              {questionOptions
                .filter((question) => input.relatedSets.includes(question.setId))
                .map((question) => (
                  <label key={question.questionId}>
                    <input
                      type="checkbox"
                      checked={input.relatedQuestionIds.includes(question.questionId)}
                      onChange={(event) => setInput((current) => ({
                        ...current,
                        relatedQuestionIds: event.target.checked
                          ? [...current.relatedQuestionIds, question.questionId]
                          : current.relatedQuestionIds.filter((item) => item !== question.questionId),
                      }))}
                    />
                    <span>{question.label}</span>
                  </label>
                ))}
            </fieldset>
          ) : null}

          {formErrors.map((message) => <StatusMessage key={message} tone="error" message={message} />)}

          <div className="actions-row">
            <button className="ghost-button" type="button" disabled={saving} onClick={closeForm}>取消</button>
            <button className="primary-button" type="button" disabled={saving} onClick={() => void handleSubmit()}>
              {saving ? "儲存中…" : editingEventId ? "儲存修改" : "新增事件"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="research-event-timeline">
        {events.length === 0 ? <p className="placeholder-text">尚無現實事件紀錄。</p> : null}
        {events.map((event) => (
          <article className="research-event-card" key={event.eventId}>
            <div className="event-timeline-marker" aria-hidden="true" />
            <div className="event-card-body">
              <header>
                <div>
                  <time dateTime={`${event.eventDate}T${event.eventTime || "00:00"}`}>
                    {event.eventDate}{event.eventTime ? ` ${event.eventTime}` : ""}
                  </time>
                  <h3>{event.eventType}</h3>
                </div>
                {editable ? (
                  <button className="ghost-button compact-button" type="button" disabled={saving} onClick={() => openEdit(event)}>
                    編輯
                  </button>
                ) : null}
              </header>
              <p>{event.description}</p>
              <div className="event-fact-list">
                <span>小峰主動：{event.initiatedByXiaofeng ? "是" : "否"}</span>
                <span>直接互動：{event.isDirectInteraction ? "是" : "否"}</span>
                <span>具體行動：{event.hasConcreteAction ? "是" : "否"}</span>
              </div>
              <div className="event-relation-list">
                <span>關聯題組：{event.relatedSets.length ? event.relatedSets.join("、") : "未指定"}</span>
                <span>
                  關聯題號：{event.relatedQuestionIds.length
                    ? event.relatedQuestionIds.map((questionId) => questionLabel.get(questionId) ?? questionId).join("；")
                    : "未指定"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
