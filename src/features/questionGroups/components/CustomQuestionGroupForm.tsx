import { useState } from "react";
import { createCustomQuestionGroup, validateCustomQuestionGroup } from "../logic/createQuestionGroup";
import type { QuestionGroup } from "../types/questionGroup";

const emptyQuestions = () => Array.from({ length: 5 }, () => ({ title: "", description: "" }));

export function CustomQuestionGroupForm({
  onCreated,
  onCancel,
}: {
  onCreated: (group: QuestionGroup) => Promise<void>;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState(emptyQuestions);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateQuestion = (index: number, field: "title" | "description", value: string) => {
    setQuestions((current) => current.map((question, questionIndex) =>
      questionIndex === index ? { ...question, [field]: value } : question,
    ));
  };

  const handleSubmit = async () => {
    const input = { category, title, description, questions };
    const errors = validateCustomQuestionGroup(input);
    if (errors.length > 0) {
      setError(errors.join(" "));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreated(createCustomQuestionGroup(input));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "儲存題組失敗，請稍後再試。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="custom-group-form">
      <div className="section-heading compact-heading">
        <p className="eyebrow">自訂題組</p>
        <h3>建立五題觀測結構</h3>
        <p className="privacy-note">請使用「對方」或「{`{觀測對象}`}」等代稱，避免輸入真實姓名。</p>
      </div>
      <div className="form-grid">
        <label className="field"><span>分類</span><input className="text-input" value={category} onChange={(event) => setCategory(event.target.value)} /></label>
        <label className="field"><span>題組名稱</span><input className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="field field-wide"><span>題組說明</span><textarea className="text-area" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      </div>
      <div className="custom-question-list">
        {questions.map((question, index) => (
          <fieldset key={index}>
            <legend>問題 {index + 1}</legend>
            <label className="field"><span>問題名稱</span><input className="text-input" value={question.title} onChange={(event) => updateQuestion(index, "title", event.target.value)} /></label>
            <label className="field"><span>問題說明</span><textarea className="text-area" rows={2} value={question.description} onChange={(event) => updateQuestion(index, "description", event.target.value)} /></label>
          </fieldset>
        ))}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="actions-row">
        <button className="ghost-button" type="button" onClick={onCancel}>取消</button>
        <button className="primary-button" type="button" disabled={saving} onClick={handleSubmit}>{saving ? "儲存中…" : "儲存題組"}</button>
      </div>
    </section>
  );
}
