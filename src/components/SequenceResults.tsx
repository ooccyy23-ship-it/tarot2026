import type { SequenceResult, ValidationIssue } from "../types/tarot";
import { StatusMessage } from "./StatusMessage";

type SequenceResultsProps = {
  sequenceResult: SequenceResult | null;
  validationIssues: ValidationIssue[];
};

const cards = [
  { key: "s1", label: "序號1" },
  { key: "s2", label: "序號2" },
  { key: "s3", label: "序號3" },
  { key: "s4", label: "序號4" },
  { key: "s5", label: "序號5" },
] as const;

export function SequenceResults({ sequenceResult, validationIssues }: SequenceResultsProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">步驟 2</p>
        <h2>五序號計算結果</h2>
      </div>

      {!sequenceResult ? <p className="placeholder-text">完成設定後，這裡會顯示五個序號。</p> : null}

      {sequenceResult ? (
        <>
          <div className="sequence-grid">
            {cards.map((card) => (
              <article key={card.key} className="sequence-card">
                <span>{card.label}</span>
                <strong>{sequenceResult.formattedValues[card.key]}</strong>
              </article>
            ))}
          </div>

          {validationIssues.length > 0 ? (
            <>
              <StatusMessage tone="error" message="此時間不適合抽牌" />
              <div className="invalid-table">
                <div className="invalid-row invalid-header">
                  <span>無效序號</span>
                  <span>無效數值</span>
                  <span>無效原因</span>
                </div>
                {validationIssues.map((issue) => (
                  <div key={issue.sequence} className="invalid-row">
                    <span>{issue.label}</span>
                    <span>{issue.value}</span>
                    <span>{issue.reason}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <StatusMessage tone="success" message="序號有效，已可進行正逆位硬幣操作。" />
          )}

          <details className="details-panel">
            <summary>查看計算過程</summary>
            <div className="details-content">
              <p>{sequenceResult.explanations.s1}</p>
              <p>{sequenceResult.explanations.s2}</p>
              <div>
                <p>序號3：</p>
                {sequenceResult.explanations.s3.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div>
                <p>序號4：</p>
                {sequenceResult.explanations.s4.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p>序號5：</p>
              <p>{sequenceResult.explanations.s5}</p>
            </div>
          </details>
        </>
      ) : null}
    </section>
  );
}
