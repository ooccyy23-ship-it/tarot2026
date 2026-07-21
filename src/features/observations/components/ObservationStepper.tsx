const steps = ["基本資料與題組", "觀測前紀錄", "抽牌", "解讀整理", "現實驗證設定", "確認與儲存"];

export function ObservationStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="stepper" aria-label="新增觀測進度">
      {steps.map((label, index) => {
        const number = index + 1;
        const state = number < currentStep ? "completed" : number === currentStep ? "current" : "upcoming";
        return (
          <li key={label} className={state} aria-current={state === "current" ? "step" : undefined}>
            <span>{state === "completed" ? "✓" : number}</span>
            <div><small>步驟 {number}</small><strong>{label}</strong></div>
          </li>
        );
      })}
    </ol>
  );
}
