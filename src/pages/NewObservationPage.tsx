import { useCallback, useEffect, useMemo, useState } from "react";
import { InterpretationStep } from "../features/observations/components/InterpretationStep";
import { ObservationDrawStep } from "../features/observations/components/ObservationDrawStep";
import { ObservationStepper } from "../features/observations/components/ObservationStepper";
import { attachDrawResultOnce } from "../features/observations/logic/observationDraft";
import { getSetting, initializeDatabase, listQuestionGroups, saveQuestionGroup, saveSetting } from "../features/observations/storage/database";
import type { DrawResult } from "../features/observations/types/observation";
import type { ObservationDraft } from "../features/observations/types/observationDraft";
import { QuestionGroupSelector } from "../features/questionGroups/components/QuestionGroupSelector";
import type { QuestionGroup } from "../features/questionGroups/types/questionGroup";
import { getWeekdayLabel, weekdayOptions } from "../logic/weekday";
import type { WeekdayKey } from "../types/tarot";

const emotions = ["平靜", "期待", "焦慮", "困惑", "失落", "生氣", "矛盾", "無明顯情緒", "其他"];
const dayKeys: WeekdayKey[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function weekdayFromDate(value: string): number {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date().getDay() : date.getDay();
}

function createInitialDraft(): ObservationDraft {
  const observationDate = localDateString();
  return {
    currentStep: 1,
    observationDate,
    drawTime: "",
    subjectAlias: "",
    topic: "",
    contextNote: "",
    weekday: weekdayFromDate(observationDate),
    questionGroupId: "",
    questionGroupSnapshot: null,
    preEmotion: {
      primaryEmotion: "無明顯情緒",
      customEmotion: "",
      expectationLevel: 5,
      anxietyLevel: 5,
      calmLevel: 5,
      expectedResult: "",
      fearedResult: "",
      note: "",
    },
    drawResult: null,
    interpretations: [],
    overallInterpretation: { summary: "", primaryJudgment: "", uncertainties: "" },
  };
}

function normalizeDraft(saved?: Partial<ObservationDraft>): ObservationDraft {
  const initial = createInitialDraft();
  if (!saved) return initial;
  const requestedStep = Number(saved.currentStep ?? 1);
  const maxStep = saved.drawResult ? 4 : 3;
  const currentStep = Math.min(Math.max(requestedStep, 1), maxStep) as ObservationDraft["currentStep"];
  return {
    ...initial,
    ...saved,
    currentStep,
    weekday: Number.isInteger(saved.weekday) && Number(saved.weekday) >= 0 && Number(saved.weekday) <= 6
      ? Number(saved.weekday)
      : initial.weekday,
    preEmotion: { ...initial.preEmotion, ...(saved.preEmotion ?? {}) },
    drawResult: saved.drawResult ?? null,
    interpretations: saved.interpretations ?? [],
    overallInterpretation: { ...initial.overallInterpretation, ...(saved.overallInterpretation ?? {}) },
  };
}

export function NewObservationPage() {
  const [step, setStep] = useState<ObservationDraft["currentStep"]>(1);
  const [draft, setDraft] = useState<ObservationDraft>(createInitialDraft);
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([initializeDatabase(), getSetting<ObservationDraft>("newObservationDraft")])
      .then(async ([, savedDraft]) => {
        const nextDraft = normalizeDraft(savedDraft);
        setDraft(nextDraft);
        setStep(nextDraft.currentStep);
        setGroups(await listQuestionGroups());
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "無法讀取本機資料。"))
      .finally(() => setLoading(false));
  }, []);

  const automaticWeekday = useMemo(() => weekdayFromDate(draft.observationDate), [draft.observationDate]);
  const selectedWeekdayKey = dayKeys[draft.weekday];

  const persistDraft = async (nextDraft: ObservationDraft) => {
    setDraft(nextDraft);
    await saveSetting("newObservationDraft", nextDraft);
  };

  const updateDraft = <K extends keyof ObservationDraft>(key: K, value: ObservationDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
  };

  const handleDateChange = (value: string) => {
    setDraft((current) => ({ ...current, observationDate: value, weekday: weekdayFromDate(value) }));
    setMessage("");
  };

  const goToEmotionStep = async () => {
    if (!draft.observationDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.drawTime)) {
      setMessage("請填寫觀測日期與有效時間（HH:MM）。");
      return;
    }
    if (!draft.questionGroupSnapshot || draft.questionGroupSnapshot.questions.length !== 5) {
      setMessage("請選擇一個包含五個問題的題組。");
      return;
    }
    const nextDraft = { ...draft, currentStep: 2 as const };
    await persistDraft(nextDraft);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToDrawStep = async () => {
    const nextDraft = { ...draft, currentStep: 3 as const };
    await persistDraft(nextDraft);
    setStep(3);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDrawComplete = useCallback((result: DrawResult) => {
    setDraft((current) => {
      const nextDraft = attachDrawResultOnce(current, result);
      if (nextDraft === current) return current;
      void saveSetting("newObservationDraft", nextDraft);
      return nextDraft;
    });
    setMessage("五張牌已完成並鎖定，抽牌結果已儲存在此瀏覽器。");
  }, []);

  const goToInterpretationStep = async () => {
    if (!draft.drawResult) return;
    const nextDraft = { ...draft, currentStep: 4 as const };
    await persistDraft(nextDraft);
    setStep(4);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveInterpretationDraft = async () => {
    const nextDraft = { ...draft, currentStep: 4 as const };
    await persistDraft(nextDraft);
    setMessage("步驟 4 解讀內容已安全儲存在此瀏覽器；驗證設定將於第三階段接續。");
  };

  return (
    <main className="content-page observation-flow">
      <header className="page-title">
        <div><p className="eyebrow">新增觀測</p><h1>建立一筆完整觀測</h1><p>分步記錄，抽牌結果會在後續步驟鎖定並綁定題目。</p></div>
        <span className="status-chip draft">草稿</span>
      </header>
      <ObservationStepper currentStep={step} />

      {loading ? <section className="panel"><p>正在讀取本機資料…</p></section> : null}

      {!loading && step === 1 ? (
        <section className="panel flow-panel">
          <div className="section-heading"><p className="eyebrow">步驟 1</p><h2>基本資料與題組</h2></div>
          <div className="form-grid">
            <label className="field"><span>觀測日期</span><input className="text-input" type="date" value={draft.observationDate} onChange={(event) => handleDateChange(event.target.value)} /></label>
            <label className="field"><span>觀測時間</span><input className="text-input" type="text" inputMode="numeric" maxLength={5} placeholder="HH:MM，例如 09:55" value={draft.drawTime} onChange={(event) => updateDraft("drawTime", event.target.value)} /></label>
            <label className="field"><span>日期自動判定星期</span><input className="text-input readonly-input" readOnly value={getWeekdayLabel(dayKeys[automaticWeekday])} /></label>
            <label className="field"><span>牌卡對照星期</span><select className="select-input" value={selectedWeekdayKey} onChange={(event) => updateDraft("weekday", dayKeys.indexOf(event.target.value as WeekdayKey))}>{weekdayOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
            <label className="field"><span>觀測對象代稱</span><input className="text-input" placeholder="例如：對方、A、合作對象" value={draft.subjectAlias} onChange={(event) => updateDraft("subjectAlias", event.target.value)} /><small>建議只填代稱，避免輸入完整姓名。</small></label>
            <label className="field"><span>觀測主題</span><input className="text-input" value={draft.topic} onChange={(event) => updateDraft("topic", event.target.value)} /></label>
            <label className="field field-wide"><span>補充背景</span><textarea className="text-area" rows={4} value={draft.contextNote} onChange={(event) => updateDraft("contextNote", event.target.value)} /></label>
          </div>
          {draft.weekday !== automaticWeekday ? <p className="notice-text">目前牌卡對照星期與日期自動判定不同：已保留你的手動選擇。</p> : null}
          <QuestionGroupSelector
            groups={groups}
            selectedGroupId={draft.questionGroupId}
            onSelect={(group) => setDraft((current) => ({ ...current, questionGroupId: group?.id ?? "", questionGroupSnapshot: group ? structuredClone(group) : null }))}
            onCreate={async (group) => { await saveQuestionGroup(group); setGroups((current) => [...current, group]); }}
          />
          {message ? <p className="form-error" role="alert">{message}</p> : null}
          <div className="flow-actions"><a className="ghost-button button-link" href="#/">返回首頁</a><button className="primary-button" type="button" onClick={goToEmotionStep}>下一步：觀測前紀錄</button></div>
        </section>
      ) : null}

      {!loading && step === 2 ? (
        <section className="panel flow-panel">
          <div className="section-heading"><p className="eyebrow">步驟 2</p><h2>觀測前情緒與期待</h2><p className="section-description">請記錄抽牌前的狀態；沒有標準答案，只需忠實描述當下。</p></div>
          <div className="form-grid">
            <label className="field"><span>當下主要情緒</span><select className="select-input" value={draft.preEmotion.primaryEmotion} onChange={(event) => setDraft((current) => ({ ...current, preEmotion: { ...current.preEmotion, primaryEmotion: event.target.value } }))}>{emotions.map((emotion) => <option key={emotion}>{emotion}</option>)}</select></label>
            {draft.preEmotion.primaryEmotion === "其他" ? <label className="field"><span>其他情緒</span><input className="text-input" value={draft.preEmotion.customEmotion} onChange={(event) => setDraft((current) => ({ ...current, preEmotion: { ...current.preEmotion, customEmotion: event.target.value } }))} /></label> : <div />}
          </div>
          <div className="range-grid">
            {([ ["expectationLevel", "期待程度"], ["anxietyLevel", "焦慮程度"], ["calmLevel", "平靜程度"] ] as const).map(([key, label]) => (
              <label className="range-field" key={key}><span>{label}</span><div><input type="range" min="0" max="10" value={draft.preEmotion[key]} onChange={(event) => setDraft((current) => ({ ...current, preEmotion: { ...current.preEmotion, [key]: Number(event.target.value) } }))} /><output>{draft.preEmotion[key]}</output></div></label>
            ))}
          </div>
          <div className="form-grid">
            <label className="field field-wide"><span>我目前期待看到什麼結果？</span><textarea className="text-area" rows={3} value={draft.preEmotion.expectedResult} onChange={(event) => setDraft((current) => ({ ...current, preEmotion: { ...current.preEmotion, expectedResult: event.target.value } }))} /></label>
            <label className="field field-wide"><span>我目前最擔心看到什麼結果？</span><textarea className="text-area" rows={3} value={draft.preEmotion.fearedResult} onChange={(event) => setDraft((current) => ({ ...current, preEmotion: { ...current.preEmotion, fearedResult: event.target.value } }))} /></label>
            <label className="field field-wide"><span>補充說明</span><textarea className="text-area" rows={3} value={draft.preEmotion.note} onChange={(event) => setDraft((current) => ({ ...current, preEmotion: { ...current.preEmotion, note: event.target.value } }))} /></label>
          </div>
          {message ? <p className="notice-text" role="status">{message}</p> : null}
          <div className="flow-actions"><button className="ghost-button" type="button" onClick={() => setStep(1)}>返回修改</button><button className="primary-button" type="button" onClick={goToDrawStep}>下一步：抽牌</button></div>
        </section>
      ) : null}

      {!loading && step === 3 ? (
        <ObservationDrawStep
          draft={draft}
          onBack={() => setStep(2)}
          onComplete={handleDrawComplete}
          onContinue={goToInterpretationStep}
        />
      ) : null}

      {!loading && step === 4 ? (
        <InterpretationStep
          draft={draft}
          onChange={(nextDraft) => { setDraft(nextDraft); setMessage(""); }}
          onBack={() => setStep(3)}
          onSave={saveInterpretationDraft}
          message={message}
        />
      ) : null}
    </main>
  );
}
