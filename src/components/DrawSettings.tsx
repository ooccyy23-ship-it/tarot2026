import type { Ref } from "react";
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
  submitLabel?: string;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  disabledReason?: string;
};

export function DrawSettings({
  timeInput,
  weekday,
  systemWeekday,
  error,
  onTimeInputChange,
  onWeekdayChange,
  onSubmit,
  submitLabel = "計算五個序號",
  disabled = false,
  inputRef,
  collapsed = false,
  onToggleCollapsed,
  disabledReason,
}: DrawSettingsProps) {
  return (
    <section className={`panel draw-panel draw-settings-panel ${collapsed ? "is-step-collapsed" : ""}`}>
      <div className="section-heading draw-step-heading">
        <div><p className="eyebrow">步驟 1</p><h2>抽牌設定</h2></div>
        {onToggleCollapsed ? <button className="ghost-button compact-button" type="button" onClick={onToggleCollapsed}>{collapsed ? "展開查看" : "收合"}</button> : null}
      </div>
      {collapsed ? <p className="draw-step-summary">已完成設定：{timeInput || "尚未輸入"} · {getWeekdayLabel(weekday)}</p> : <><div className="settings-grid">
        <label className="field">
          <span className="field-label">抽牌時間</span>
          <input
            className="text-input draw-input"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="請輸入 09:55"
            value={timeInput}
            disabled={disabled}
            ref={inputRef}
            onChange={(event) => onTimeInputChange(event.target.value)}
          />
          <small>輸入 4 個數字後會自動顯示為 HH:MM。</small>
        </label>

        <label className="field">
          <span className="field-label">對照表星期</span>
          <select
            className="select-input draw-input"
            value={weekday}
            disabled={disabled}
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

      <div className="draw-settings-actions">
        <button className="primary-button draw-submit-button" type="button" disabled={disabled} onClick={onSubmit}>
          {submitLabel}
        </button>
        {disabled && disabledReason ? <small className="draw-disabled-reason">{disabledReason}</small> : null}
      </div>
      </>}
    </section>
  );
}
