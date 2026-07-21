import { useMemo, useState } from "react";
import type { QuestionGroup } from "../types/questionGroup";
import { CustomQuestionGroupForm } from "./CustomQuestionGroupForm";

type Props = {
  groups: QuestionGroup[];
  selectedGroupId: string;
  onSelect: (group: QuestionGroup | null) => void;
  onCreate: (group: QuestionGroup) => Promise<void>;
};

export function QuestionGroupSelector({ groups, selectedGroupId, onSelect, onCreate }: Props) {
  const [category, setCategory] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const activeGroups = useMemo(() => groups.filter((group) => group.active), [groups]);
  const categories = useMemo(
    () => Array.from(new Set(activeGroups.map((group) => group.category))).sort(),
    [activeGroups],
  );
  const filteredGroups = category ? activeGroups.filter((group) => group.category === category) : activeGroups;
  const selectedGroup = activeGroups.find((group) => group.id === selectedGroupId) ?? null;

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (selectedGroup && selectedGroup.category !== value) onSelect(null);
  };

  return (
    <div className="question-group-section">
      <div className="form-grid">
        <label className="field">
          <span>題組分類</span>
          <select className="select-input" value={category} onChange={(event) => handleCategoryChange(event.target.value)}>
            <option value="">全部分類</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="field">
          <span>題組名稱</span>
          <select
            className="select-input"
            value={selectedGroupId}
            onChange={(event) => onSelect(activeGroups.find((group) => group.id === event.target.value) ?? null)}
          >
            <option value="">請選擇題組</option>
            {filteredGroups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}
          </select>
        </label>
      </div>

      {activeGroups.length === 0 ? (
        <div className="empty-inline">
          <strong>尚無題組資料</strong>
          <p>歷史題組將由後續 JSON 匯入；目前可先建立不含真實姓名的自訂題組。</p>
        </div>
      ) : null}

      {selectedGroup ? (
        <section className="question-preview" aria-label="五個問題預覽">
          <div>
            <strong>{selectedGroup.title}</strong>
            {selectedGroup.description ? <p>{selectedGroup.description}</p> : null}
          </div>
          <ol>
            {[...selectedGroup.questions].sort((a, b) => a.order - b.order).map((question) => (
              <li key={question.id}>
                <strong>{question.title}</strong>
                {question.description ? <span>{question.description}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <button className="ghost-button inline-button" type="button" onClick={() => setShowCustomForm((value) => !value)}>
        {showCustomForm ? "收合自訂題組" : "＋建立自訂題組"}
      </button>

      {showCustomForm ? (
        <CustomQuestionGroupForm
          onCancel={() => setShowCustomForm(false)}
          onCreated={async (group) => {
            await onCreate(group);
            setCategory(group.category);
            onSelect(group);
            setShowCustomForm(false);
          }}
        />
      ) : null}
    </div>
  );
}
