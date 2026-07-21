import { getWeekdayLabel, weekdayOptions } from "../logic/weekday";
import type { WeekdayKey } from "../types/tarot";
import { StatusMessage } from "./StatusMessage";

type DrawSettingsProps = {
  timeInput: string;
  weekday: WeekdayKey;
  systemWeekday: WeekdayKey;
  error: string | null;
  onTimeInputChange: (value: string) => void;
  onWeekdayChange: (value: WeekdayKey) => void;
  onSubmit: () => void;
};

export function DrawSettings({
  timeInput,
  weekday,
  systemWeekday,
  error,
  onTimeInputChange,
  onWeekdayChange,
  onSubmit,
}: DrawSettingsProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">步驟 1</p>
        <h2>抽牌設定</h2>
      </div>
      <div className="settings-grid">
        <label className="field">
          <span>抽牌時間</span>
          <input
            className="text-input"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="請輸入 09:55"
            value={timeInput}
            onChange={(event) => onTimeInputChange(event.target.value)}
          />
          <small>輸入 4 個數字後會自動顯示為 HH:MM。</small>
        </label>

        <label className="field">
          <span>對照表星期</span>
          <select
            className="select-input"
            value={weekday}
            onChange={(event) => onWeekdayChange(event.target.value as WeekdayKey)}
          >
            {weekdayOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <small>系統今日預設為 {getWeekdayLabel(systemWeekday)}。</small>
        </label>
      </div>

      {weekday !== systemWeekday ? (
        <StatusMessage tone="warning" message="目前選擇的對照表與系統日期不一致" />
      ) : null}
      {error ? <StatusMessage tone="error" message={error} /> : null}

      <button className="primary-button" type="button" onClick={onSubmit}>
        計算五個序號
      </button>
    </section>
  );
}
