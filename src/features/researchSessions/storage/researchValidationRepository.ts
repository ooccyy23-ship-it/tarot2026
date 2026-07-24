import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDocsFromServer,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import {
  canCompleteResearchSession,
  normalizeQuestionValidationInput,
  researchValidationStatuses,
  validateQuestionValidationInput,
  validationDocumentId,
  type ResearchQuestionValidationInput,
} from "../logic/researchSessionValidation";
import { getVerificationScore } from "../logic/researchSessionCalculations";
import type {
  ResearchQuestionValidationRecord,
  ResearchSession,
  ResearchSetCode,
  ResearchSessionDrawCard,
  SessionQuestionGroupDrawResult,
} from "../types/researchSession";

const SESSION_COLLECTION = "sevenDaySessions";
const VALIDATION_COLLECTION = "validations";

function requireOwnerId(ownerId: string): string {
  const value = ownerId.trim();
  if (!value) throw new Error("請先登入再管理最終驗證。");
  return value;
}

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toValidation(data: DocumentData, documentId: string): ResearchQuestionValidationRecord {
  if (
    documentId !== validationDocumentId(data.setId, data.questionIndex)
    || !["A", "B", "C"].includes(data.setId)
    || !Number.isInteger(data.questionIndex)
    || !researchValidationStatuses.includes(data.validationStatus)
    || typeof data.questionText !== "string"
    || typeof data.evidence !== "string"
    || typeof data.cardSnapshot !== "object"
  ) {
    throw new Error(`驗證資料 ${documentId} 的格式不正確。`);
  }
  return {
    setId: data.setId,
    questionIndex: data.questionIndex,
    questionText: data.questionText,
    cardSnapshot: data.cardSnapshot as ResearchSessionDrawCard,
    validationStatus: data.validationStatus,
    validationScore: typeof data.validationScore === "number" ? data.validationScore : null,
    evidence: data.evidence,
    ...(typeof data.note === "string" && data.note ? { note: data.note } : {}),
    validatedAt: toDate(data.validatedAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function sessionContext(data: DocumentData): Pick<ResearchSession, "status" | "completedSets"> {
  return {
    status: data.status,
    completedSets: Array.isArray(data.completedSets) ? data.completedSets : [],
  };
}

function lockedSet(data: DocumentData): SessionQuestionGroupDrawResult {
  if (
    !["A", "B", "C"].includes(data.setId)
    || data.isLocked !== true
    || !Array.isArray(data.cards)
    || data.cards.length !== 5
  ) {
    throw new Error("題組抽牌結果尚未完整鎖定。");
  }
  return data as SessionQuestionGroupDrawResult;
}

export class ResearchValidationRepository {
  constructor(private readonly database: Firestore) {}

  async list(ownerIdInput: string, sessionId: string): Promise<ResearchQuestionValidationRecord[]> {
    const ownerId = requireOwnerId(ownerIdInput);
    const snapshot = await getDocsFromServer(
      collection(
        this.database,
        "users",
        ownerId,
        SESSION_COLLECTION,
        sessionId,
        VALIDATION_COLLECTION,
      ),
    );
    return snapshot.docs
      .map((item) => toValidation(item.data(), item.id))
      .sort((a, b) => a.setId.localeCompare(b.setId) || a.questionIndex - b.questionIndex);
  }

  async save(
    ownerIdInput: string,
    sessionId: string,
    setId: ResearchSetCode,
    questionIndex: number,
    input: ResearchQuestionValidationInput,
  ): Promise<ResearchQuestionValidationRecord> {
    const ownerId = requireOwnerId(ownerIdInput);
    const sessionRef = doc(this.database, "users", ownerId, SESSION_COLLECTION, sessionId);
    const setRef = doc(sessionRef, "sets", setId);
    const validationRef = doc(
      sessionRef,
      VALIDATION_COLLECTION,
      validationDocumentId(setId, questionIndex),
    );
    const normalized = normalizeQuestionValidationInput(input);

    return runTransaction(this.database, async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      const setSnapshot = await transaction.get(setRef);
      const existingSnapshot = await transaction.get(validationRef);
      if (!sessionSnapshot.exists()) throw new Error("找不到這筆 Session。");
      if (!setSnapshot.exists()) throw new Error(`找不到題組 ${setId} 的鎖定抽牌結果。`);
      const sessionData = sessionSnapshot.data();
      if (sessionData.ownerId !== ownerId) throw new Error("沒有權限管理這筆 Session。");
      const errors = validateQuestionValidationInput(sessionContext(sessionData), normalized);
      if (errors.length > 0) throw new Error(errors.join(" "));

      const setResult = lockedSet(setSnapshot.data());
      const card = setResult.cards.find((item) => item.questionIndex === questionIndex);
      if (!card) throw new Error(`題組 ${setId} 第 ${questionIndex} 題不存在。`);
      const score = getVerificationScore(normalized.validationStatus);
      const now = serverTimestamp();
      const stored = {
        setId,
        questionIndex,
        questionText: card.questionText,
        cardSnapshot: card,
        validationStatus: normalized.validationStatus,
        validationScore: score,
        evidence: normalized.evidence,
        ...(normalized.note ? { note: normalized.note } : {}),
        validatedAt: existingSnapshot.exists()
          ? existingSnapshot.data().validatedAt
          : now,
        updatedAt: now,
      };

      if (existingSnapshot.exists()) {
        transaction.update(validationRef, {
          ...stored,
          note: normalized.note ?? deleteField(),
        });
      } else {
        transaction.set(validationRef, stored);
        transaction.update(sessionRef, {
          validatedQuestionIds: arrayUnion(validationDocumentId(setId, questionIndex)),
          updatedAt: now,
        });
      }
      return {
        ...stored,
        validatedAt: existingSnapshot.exists()
          ? toDate(existingSnapshot.data().validatedAt)
          : null,
        updatedAt: null,
      };
    });
  }

  async complete(ownerIdInput: string, sessionId: string): Promise<void> {
    const ownerId = requireOwnerId(ownerIdInput);
    const sessionRef = doc(this.database, "users", ownerId, SESSION_COLLECTION, sessionId);
    const setRefs = (["A", "B", "C"] as const).map((setId) => doc(sessionRef, "sets", setId));
    const validationRefs = (["A", "B", "C"] as const).flatMap((setId) => (
      [1, 2, 3, 4, 5].map((questionIndex) => doc(
        sessionRef,
        VALIDATION_COLLECTION,
        validationDocumentId(setId, questionIndex),
      ))
    ));

    await runTransaction(this.database, async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      const setSnapshots = await Promise.all(setRefs.map((reference) => transaction.get(reference)));
      const validationSnapshots = await Promise.all(
        validationRefs.map((reference) => transaction.get(reference)),
      );
      if (!sessionSnapshot.exists()) throw new Error("找不到這筆 Session。");
      const sessionData = sessionSnapshot.data();
      if (sessionData.ownerId !== ownerId) throw new Error("沒有權限完成這筆 Session。");
      const session = {
        ...sessionContext(sessionData),
      };
      const setResults = setSnapshots.map((snapshot) => {
        if (!snapshot.exists()) throw new Error("三個題組必須全部抽牌並鎖定。");
        return lockedSet(snapshot.data());
      });
      const validations = validationSnapshots.map((snapshot) => {
        if (!snapshot.exists()) throw new Error("15 題尚未全部完成驗證。");
        return toValidation(snapshot.data(), snapshot.id);
      });
      if (!canCompleteResearchSession(session, setResults, validations)) {
        throw new Error("15 題尚未全部完成驗證，或 Session 狀態不允許完成。");
      }
      transaction.update(sessionRef, {
        status: "completed",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }
}

export const researchValidationFirestorePath =
  "users/{uid}/sevenDaySessions/{sessionId}/validations/{A|B|C}-{1..5}" as const;
