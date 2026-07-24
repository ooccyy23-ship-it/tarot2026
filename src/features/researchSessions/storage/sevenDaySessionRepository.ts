import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { calculateValidationDueDate } from "../logic/researchSessionCalculations";
import { advanceResearchDrawProgress } from "../logic/researchSessionDraw";
import { assertResearchSessionTransition } from "../logic/researchSessionState";
import type {
  ResearchSession,
  ResearchSessionStatus,
  SessionQuestionGroupDrawResult,
} from "../types/researchSession";

const SESSION_COLLECTION = "sevenDaySessions";
const COUNTER_COLLECTION = "sevenDaySessionCounters";

type SessionCounter = {
  lastSerial: number;
  activeSessionId?: string;
};

export type CreateSevenDaySessionResult = {
  session: ResearchSession;
  created: boolean;
};

export type SaveLockedSetResult = {
  session: ResearchSession;
  saved: boolean;
};

function requireOwnerId(ownerId: string): string {
  const value = ownerId.trim();
  if (!value) throw new Error("必須先登入才能存取研究 Session。");
  return value;
}

function dateKey(startDate: string): string {
  calculateValidationDueDate(startDate);
  return startDate.replace(/-/g, "");
}

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toIsoDate(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : "";
}

function toLockedSetResult(data: DocumentData): SessionQuestionGroupDrawResult {
  if (
    !["A", "B", "C"].includes(data.setId)
    || data.isLocked !== true
    || !Array.isArray(data.cards)
    || data.cards.length !== 5
    || !Array.isArray(data.sequences)
    || data.sequences.length !== 5
  ) {
    throw new Error("研究題組的鎖定結果格式不正確。");
  }
  return {
    ...data,
    lockedAt: toIsoDate(data.lockedAt),
  } as SessionQuestionGroupDrawResult;
}

function toResearchSession(data: DocumentData, documentId: string): ResearchSession {
  if (
    data.sessionId !== documentId
    || data.sessionType !== "seven_day_three_sets"
    || typeof data.ownerId !== "string"
  ) {
    throw new Error(`Session ${documentId} 的資料格式不正確。`);
  }
  return {
    sessionId: documentId,
    schemaVersion: 1,
    ownerId: data.ownerId,
    sessionType: "seven_day_three_sets",
    subject: "小峰",
    relationshipScope: "我和小峰之間的感情互動",
    startDate: String(data.startDate),
    validationDeadline: String(data.validationDeadline),
    status: data.status as ResearchSessionStatus,
    currentSet: data.currentSet,
    completedSets: Array.isArray(data.completedSets) ? data.completedSets : [],
    totalCards: 15,
    groupDrawResults: Array.isArray(data.groupDrawResults) ? data.groupDrawResults : [],
    events: Array.isArray(data.events) ? data.events : [],
    verificationResults: Array.isArray(data.verificationResults) ? data.verificationResults : [],
    validatedQuestionIds: Array.isArray(data.validatedQuestionIds)
      ? data.validatedQuestionIds
      : [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    completedAt: toDate(data.completedAt),
    invalidReason: typeof data.invalidReason === "string" ? data.invalidReason : null,
  };
}

function assertOwnedSession(session: ResearchSession, ownerId: string): void {
  if (session.ownerId !== ownerId) throw new Error("沒有權限存取這筆 Session。");
}

export class SevenDaySessionRepository {
  constructor(private readonly database: Firestore) {}

  private async getLockedSets(ownerId: string, sessionId: string): Promise<SessionQuestionGroupDrawResult[]> {
    const setsSnapshot = await getDocsFromServer(
      collection(
        this.database,
        "users",
        ownerId,
        SESSION_COLLECTION,
        sessionId,
        "sets",
      ),
    );
    return setsSnapshot.docs
      .map((item) => toLockedSetResult(item.data()))
      .sort((a, b) => a.setId.localeCompare(b.setId));
  }

  async create(ownerIdInput: string, startDate: string): Promise<CreateSevenDaySessionResult> {
    const ownerId = requireOwnerId(ownerIdInput);
    const dayKey = dateKey(startDate);
    const counterRef = doc(this.database, "users", ownerId, COUNTER_COLLECTION, dayKey);

    return runTransaction(this.database, async (transaction) => {
      const counterSnapshot = await transaction.get(counterRef);
      const counter = counterSnapshot.exists()
        ? counterSnapshot.data() as SessionCounter
        : { lastSerial: 0 };

      if (counter.activeSessionId) {
        const activeRef = doc(
          this.database,
          "users",
          ownerId,
          SESSION_COLLECTION,
          counter.activeSessionId,
        );
        const activeSnapshot = await transaction.get(activeRef);
        if (activeSnapshot.exists()) {
          const activeSession = toResearchSession(activeSnapshot.data(), activeSnapshot.id);
          assertOwnedSession(activeSession, ownerId);
          if (activeSession.status !== "invalid") {
            return { session: activeSession, created: false };
          }
        }
      }

      const serial = Math.max(Number(counter.lastSerial) || 0, 0) + 1;
      const sessionId = `7D-${dayKey}-${String(serial).padStart(3, "0")}`;
      const sessionRef = doc(this.database, "users", ownerId, SESSION_COLLECTION, sessionId);
      const timestamp = serverTimestamp();
      const storedSession = {
        sessionId,
        schemaVersion: 1 as const,
        ownerId,
        sessionType: "seven_day_three_sets" as const,
        subject: "小峰" as const,
        relationshipScope: "我和小峰之間的感情互動" as const,
        startDate,
        validationDeadline: calculateValidationDueDate(startDate),
        status: "draft" as const,
        currentSet: "A" as const,
        completedSets: [] as ResearchSession["completedSets"],
        totalCards: 15 as const,
        groupDrawResults: [] as ResearchSession["groupDrawResults"],
        events: [] as ResearchSession["events"],
        verificationResults: [] as ResearchSession["verificationResults"],
        validatedQuestionIds: [] as string[],
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: null,
        invalidReason: null,
      };

      transaction.set(sessionRef, storedSession);
      transaction.set(counterRef, {
        lastSerial: serial,
        activeSessionId: sessionId,
        updatedAt: timestamp,
      });

      return {
        created: true,
        session: {
          ...storedSession,
          createdAt: null,
          updatedAt: null,
        },
      };
    });
  }

  async get(ownerIdInput: string, sessionId: string): Promise<ResearchSession | undefined> {
    const ownerId = requireOwnerId(ownerIdInput);
    const sessionRef = doc(this.database, "users", ownerId, SESSION_COLLECTION, sessionId);
    const snapshot = await getDocFromServer(sessionRef);
    if (!snapshot.exists()) return undefined;
    const session = toResearchSession(snapshot.data(), snapshot.id);
    assertOwnedSession(session, ownerId);
    return {
      ...session,
      groupDrawResults: await this.getLockedSets(ownerId, sessionId),
    };
  }

  async list(ownerIdInput: string): Promise<ResearchSession[]> {
    const ownerId = requireOwnerId(ownerIdInput);
    const sessionsQuery = query(
      collection(this.database, "users", ownerId, SESSION_COLLECTION),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await getDocsFromServer(sessionsQuery);
    return snapshot.docs.map((item) => {
      const session = toResearchSession(item.data(), item.id);
      assertOwnedSession(session, ownerId);
      return session;
    });
  }

  async updateStatus(
    ownerIdInput: string,
    sessionId: string,
    nextStatus: Exclude<ResearchSessionStatus, "invalid">,
  ): Promise<void> {
    const ownerId = requireOwnerId(ownerIdInput);
    const sessionRef = doc(this.database, "users", ownerId, SESSION_COLLECTION, sessionId);
    await runTransaction(this.database, async (transaction) => {
      const snapshot = await transaction.get(sessionRef);
      if (!snapshot.exists()) throw new Error("找不到指定的 Session。");
      const current = toResearchSession(snapshot.data(), snapshot.id);
      assertOwnedSession(current, ownerId);
      assertResearchSessionTransition(current.status, nextStatus);
      transaction.update(sessionRef, {
        status: nextStatus,
        updatedAt: serverTimestamp(),
        completedAt: nextStatus === "completed" ? serverTimestamp() : current.completedAt,
      });
    });
  }

  async saveLockedSet(
    ownerIdInput: string,
    sessionId: string,
    result: SessionQuestionGroupDrawResult,
  ): Promise<SaveLockedSetResult> {
    const ownerId = requireOwnerId(ownerIdInput);
    if (!result.isLocked || result.cards.length !== 5 || result.sequences.length !== 5) {
      throw new Error("只有完整且已鎖定的五張牌結果可以保存。");
    }
    const sessionRef = doc(this.database, "users", ownerId, SESSION_COLLECTION, sessionId);
    const setRef = doc(sessionRef, "sets", result.setId);

    return runTransaction(this.database, async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      if (!sessionSnapshot.exists()) throw new Error("找不到指定的 Session。");
      const current = toResearchSession(sessionSnapshot.data(), sessionSnapshot.id);
      assertOwnedSession(current, ownerId);

      const existingSet = await transaction.get(setRef);
      if (existingSet.exists()) {
        const lockedSet = toLockedSetResult(existingSet.data());
        return {
          saved: false,
          session: {
            ...current,
            groupDrawResults: [
              ...current.groupDrawResults.filter((item) => item.setId !== lockedSet.setId),
              lockedSet,
            ].sort((a, b) => a.setId.localeCompare(b.setId)),
          },
        };
      }

      const progress = advanceResearchDrawProgress(
        current.status,
        current.completedSets,
        result.setId,
      );
      const timestamp = serverTimestamp();

      transaction.set(setRef, {
        ...result,
        ownerId,
        lockedAt: timestamp,
      });
      transaction.update(sessionRef, {
        completedSets: progress.completedSets,
        currentSet: progress.currentSet,
        status: progress.status,
        updatedAt: timestamp,
      });

      return {
        saved: true,
        session: {
          ...current,
          completedSets: progress.completedSets,
          currentSet: progress.currentSet,
          status: progress.status,
          groupDrawResults: [...current.groupDrawResults, result],
          updatedAt: null,
        },
      };
    });
  }

  async markInvalid(ownerIdInput: string, sessionId: string, reason: string): Promise<void> {
    const ownerId = requireOwnerId(ownerIdInput);
    const invalidReason = reason.trim();
    if (!invalidReason) throw new Error("請填寫 Session 無效原因。");
    const sessionRef = doc(this.database, "users", ownerId, SESSION_COLLECTION, sessionId);
    await runTransaction(this.database, async (transaction) => {
      const snapshot = await transaction.get(sessionRef);
      if (!snapshot.exists()) throw new Error("找不到指定的 Session。");
      const current = toResearchSession(snapshot.data(), snapshot.id);
      assertOwnedSession(current, ownerId);
      assertResearchSessionTransition(current.status, "invalid");
      transaction.update(sessionRef, {
        status: "invalid",
        invalidReason,
        updatedAt: serverTimestamp(),
      });
    });
  }
}

export const sevenDaySessionFirestorePaths = {
  sessions: "users/{uid}/sevenDaySessions/{sessionId}",
  sets: "users/{uid}/sevenDaySessions/{sessionId}/sets/{A|B|C}",
  counters: "users/{uid}/sevenDaySessionCounters/{YYYYMMDD}",
} as const;
