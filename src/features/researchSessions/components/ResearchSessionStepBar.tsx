import type { ResearchSession } from "../types/researchSession";

const steps = [
  "建立 Session",
  "題組 A",
  "題組 B",
  "題組 C",
  "7 天觀察",
  "最終驗證",
  "完成",
] as const;

function activeStepIndex(session: ResearchSession): number {
  if (session.status === "completed") return 6;
  if (session.status === "validation_due") return 5;
  if (session.status === "observing") return 4;
  if (session.status === "drawing") {
    return session.currentSet === "A" ? 1 : session.currentSet === "B" ? 2 : 3;
  }
  if (session.status === "invalid") return Math.min(session.completedSets.length + 1, 5);
  return 0;
}

export function ResearchSessionStepBar({ session }: { session: ResearchSession }) {
  const activeIndex = activeStepIndex(session);
  return (
    <ol className="research-session-stepbar" aria-label="7 天研究進度">
      {steps.map((label, index) => {
        const state = index < activeIndex
          ? "completed"
          : index === activeIndex
            ? session.status === "invalid" ? "invalid" : "current"
            : "upcoming";
        return (
          <li className={state} key={label}>
            <span>{index + 1}</span>
            <div>
              <strong>{label}</strong>
              <small>
                {state === "completed"
                  ? "已完成"
                  : state === "current"
                    ? "目前階段"
                    : state === "invalid"
                      ? "已失效"
                      : "尚未開放"}
              </small>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
