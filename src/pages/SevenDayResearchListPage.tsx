import { useEffect, useMemo, useRef, useState } from "react";
import { StatusMessage } from "../components/StatusMessage";
import { useAuth } from "../features/auth/useAuth";
import {
  getResearchSessionStatusLabel,
  researchSessionStatusLabels,
} from "../features/researchSessions/constants/researchSessionLabels";
import {
  filterResearchSessions,
  formatRemainingDays,
  researchSessionFilters,
  type ResearchSessionFilter,
} from "../features/researchSessions/logic/researchSessionList";
import { summarizeValidationRecords } from "../features/researchSessions/logic/researchSessionValidation";
import { getSevenDaySessionService } from "../features/researchSessions/storage/sevenDaySessionService";
import { getResearchValidationService } from "../features/researchSessions/storage/researchValidationService";
import type { ResearchSession } from "../features/researchSessions/types/researchSession";

function localDateInput(now = new Date()): string {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function rateLabel(rate: number | null | undefined): string {
  if (rate === undefined) return "—";
  if (rate === null) return "無有效題目";
  return `${Number((rate * 100).toFixed(2))}%`;
}

export function SevenDayResearchListPage() {
  const { user, initializing, actionLoading, signInWithGoogle } = useAuth();
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [rates, setRates] = useState<Record<string, number | null>>({});
  const [filter, setFilter] = useState<ResearchSessionFilter>("all");
  const [startDate, setStartDate] = useState(localDateInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const writeInFlight = useRef(false);
  const today = localDateInput();

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const listed = await getSevenDaySessionService().list();
      setSessions(listed);
      const rateEntries = await Promise.all(listed.map(async (session) => {
        const validations = await getResearchValidationService().list(session.sessionId);
        if (validations.length === 0) return null;
        return [
          session.sessionId,
          summarizeValidationRecords(validations).hitRate,
        ] as const;
      }));
      setRates(Object.fromEntries(
        rateEntries.filter((entry): entry is readonly [string, number | null] => entry !== null),
      ));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "研究列表讀取失敗。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSessions([]);
    setRates({});
    if (user) void load();
  }, [user?.uid]);

  const visibleSessions = useMemo(
    () => filterResearchSessions(sessions, filter),
    [filter, sessions],
  );

  const createSession = async () => {
    if (!user || writeInFlight.current || !startDate) return;
    writeInFlight.current = true;
    setLoading(true);
    setError("");
    try {
      const service = getSevenDaySessionService();
      const created = await service.create(startDate);
      if (created.session.status === "draft") {
        await service.updateStatus(created.session.sessionId, "drawing");
      }
      window.location.hash = `#/research/${encodeURIComponent(created.session.sessionId)}`;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Session 建立失敗。");
    } finally {
      writeInFlight.current = false;
      setLoading(false);
    }
  };

  if (initializing) {
    return <main className="content-page"><section className="panel"><p>正在確認登入狀態…</p></section></main>;
  }

  if (!user) {
    return (
      <main className="content-page">
        <header className="page-title"><div><p className="eyebrow">7 天研究</p><h1>研究 Session 列表</h1></div></header>
        <section className="panel empty-state">
          <h2>請先登入</h2>
          <p>登入後才能查看保存在 Firestore 的研究 Session。</p>
          <button className="primary-button" type="button" disabled={actionLoading} onClick={() => void signInWithGoogle()}>
            使用 Google 登入
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="content-page research-list-page">
      <header className="page-title">
        <div>
          <p className="eyebrow">7 天研究</p>
          <h1>研究 Session 列表</h1>
          <p>查看三題組研究進度、驗證期限與完成後的整體命中率。</p>
        </div>
      </header>

      {error ? <StatusMessage tone="error" message={`資料寫入失敗：${error}`} /> : null}

      <section className="panel research-list-create">
        <label className="field-group">
          <span className="field-label">開始日期</span>
          <input className="text-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <button className="primary-button" type="button" disabled={loading || !startDate} onClick={() => void createSession()}>
          {loading ? "處理中…" : "建立／開啟 Session"}
        </button>
      </section>

      <div className="research-list-filters" aria-label="Session 狀態篩選">
        {researchSessionFilters.map((item) => (
          <button
            className={filter === item ? "is-active" : ""}
            key={item}
            type="button"
            onClick={() => setFilter(item)}
          >
            {item === "all" ? "全部" : researchSessionStatusLabels[item]}
          </button>
        ))}
      </div>

      {visibleSessions.length === 0 ? (
        <section className="panel empty-state">
          <h2>沒有符合條件的 Session</h2>
          <p>可切換篩選條件，或建立第一筆 7 天研究。</p>
        </section>
      ) : (
        <section className="research-session-table" aria-label="7 天研究 Session 列表">
          <div className="research-session-table-header" aria-hidden="true">
            <span>Session ID</span><span>研究期間</span><span>狀態</span><span>題組</span>
            <span>剩餘天數</span><span>整體命中率</span><span>操作</span>
          </div>
          {visibleSessions.map((session) => (
            <article className="panel research-session-row" key={session.sessionId}>
              <div data-label="Session ID"><strong>{session.sessionId}</strong></div>
              <div data-label="研究期間">
                <span>{session.startDate}</span>
                <small>截止：{session.validationDeadline}</small>
              </div>
              <div data-label="狀態">
                <span className={`status-chip ${session.status}`}>{getResearchSessionStatusLabel(session.status)}</span>
              </div>
              <div data-label="已完成題組">{session.completedSets.length}／3</div>
              <div data-label="剩餘天數">{formatRemainingDays(session, today)}</div>
              <div data-label="整體命中率">{rateLabel(rates[session.sessionId])}</div>
              <div data-label="操作">
                <a className="secondary-button compact-button" href={`#/research/${encodeURIComponent(session.sessionId)}`}>
                  查看詳情
                </a>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
