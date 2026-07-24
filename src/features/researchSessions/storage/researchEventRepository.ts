import {
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
  normalizeResearchEventInput,
  sortResearchEvents,
  validateResearchEventInput,
  type ResearchEventInput,
} from "../logic/researchSessionEvents";
import type {
  ResearchEventRecord,
  ResearchSessionStatus,
} from "../types/researchSession";

const SESSION_COLLECTION = "sevenDaySessions";
const EVENT_COLLECTION = "events";

function requireOwnerId(ownerId: string): string {
  const value = ownerId.trim();
  if (!value) throw new Error("必須先登入才能存取現實事件。");
  return value;
}

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toResearchEvent(data: DocumentData, documentId: string): ResearchEventRecord {
  if (
    data.eventId !== documentId
    || typeof data.sessionId !== "string"
    || typeof data.ownerId !== "string"
    || typeof data.description !== "string"
  ) {
    throw new Error(`事件 ${documentId} 的資料格式不正確。`);
  }
  return {
    eventId: documentId,
    sessionId: data.sessionId,
    ownerId: data.ownerId,
    eventDate: String(data.eventDate),
    ...(typeof data.eventTime === "string" && data.eventTime
      ? { eventTime: data.eventTime }
      : {}),
    eventType: data.eventType,
    description: data.description,
    isDirectInteraction: data.isDirectInteraction === true,
    initiatedByXiaofeng: data.initiatedByXiaofeng === true,
    hasConcreteAction: data.hasConcreteAction === true,
    relatedSets: Array.isArray(data.relatedSets) ? data.relatedSets : [],
    relatedQuestionIds: Array.isArray(data.relatedQuestionIds) ? data.relatedQuestionIds : [],
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function sessionValidationContext(data: DocumentData) {
  return {
    status: data.status as ResearchSessionStatus,
    startDate: String(data.startDate),
    validationDeadline: String(data.validationDeadline),
  };
}

export class ResearchEventRepository {
  constructor(private readonly database: Firestore) {}

  async list(ownerIdInput: string, sessionId: string): Promise<ResearchEventRecord[]> {
    const ownerId = requireOwnerId(ownerIdInput);
    const eventsSnapshot = await getDocsFromServer(
      collection(
        this.database,
        "users",
        ownerId,
        SESSION_COLLECTION,
        sessionId,
        EVENT_COLLECTION,
      ),
    );
    return sortResearchEvents(eventsSnapshot.docs.map((eventDocument) => {
      const event = toResearchEvent(eventDocument.data(), eventDocument.id);
      if (event.ownerId !== ownerId || event.sessionId !== sessionId) {
        throw new Error("事件資料不屬於目前的 Session。");
      }
      return event;
    }));
  }

  async create(
    ownerIdInput: string,
    sessionId: string,
    input: ResearchEventInput,
  ): Promise<ResearchEventRecord> {
    const ownerId = requireOwnerId(ownerIdInput);
    const sessionRef = doc(this.database, "users", ownerId, SESSION_COLLECTION, sessionId);
    const eventRef = doc(collection(sessionRef, EVENT_COLLECTION));
    const normalized = normalizeResearchEventInput(input);

    return runTransaction(this.database, async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      if (!sessionSnapshot.exists()) throw new Error("找不到指定的 Session。");
      const sessionData = sessionSnapshot.data();
      if (sessionData.ownerId !== ownerId) throw new Error("沒有權限存取這筆 Session。");
      const errors = validateResearchEventInput(sessionValidationContext(sessionData), normalized);
      if (errors.length > 0) throw new Error(errors.join(" "));

      const timestamp = serverTimestamp();
      const storedEvent = {
        eventId: eventRef.id,
        sessionId,
        ownerId,
        ...normalized,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      transaction.set(eventRef, storedEvent);
      return {
        ...storedEvent,
        createdAt: null,
        updatedAt: null,
      };
    });
  }

  async update(
    ownerIdInput: string,
    sessionId: string,
    eventId: string,
    input: ResearchEventInput,
  ): Promise<ResearchEventRecord> {
    const ownerId = requireOwnerId(ownerIdInput);
    const sessionRef = doc(this.database, "users", ownerId, SESSION_COLLECTION, sessionId);
    const eventRef = doc(sessionRef, EVENT_COLLECTION, eventId);
    const normalized = normalizeResearchEventInput(input);

    return runTransaction(this.database, async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionRef);
      const eventSnapshot = await transaction.get(eventRef);
      if (!sessionSnapshot.exists()) throw new Error("找不到指定的 Session。");
      if (!eventSnapshot.exists()) throw new Error("找不到指定的事件。");
      const sessionData = sessionSnapshot.data();
      const currentEvent = toResearchEvent(eventSnapshot.data(), eventSnapshot.id);
      if (
        sessionData.ownerId !== ownerId
        || currentEvent.ownerId !== ownerId
        || currentEvent.sessionId !== sessionId
      ) {
        throw new Error("沒有權限修改這筆事件。");
      }
      const errors = validateResearchEventInput(sessionValidationContext(sessionData), normalized);
      if (errors.length > 0) throw new Error(errors.join(" "));

      transaction.update(eventRef, {
        ...normalized,
        eventTime: normalized.eventTime ?? deleteField(),
        updatedAt: serverTimestamp(),
      });
      const updatedEvent: ResearchEventRecord = {
        ...currentEvent,
        ...normalized,
        updatedAt: null,
      };
      if (!normalized.eventTime) delete updatedEvent.eventTime;
      return updatedEvent;
    });
  }
}

export const researchEventFirestorePath =
  "users/{uid}/sevenDaySessions/{sessionId}/events/{eventId}" as const;
