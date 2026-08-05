import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { getTarotCardMetadata } from "../../../data/tarotCardCatalog";
import { resolveUniqueGroupId } from "../logic/tarotRecordCollection";
import type {
  ParsedTarotGroup,
  ParsedTarotRecord,
  TarotRecordEditableFields,
  TarotRecordGroupSummary,
  TarotOrientationLabel,
} from "../types/tarotRecord";

const RECORD_COLLECTION = "tarotRecords";
const GROUP_COLLECTION = "tarotRecordGroups";

function timestampToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : "";
}

function toRecord(data: DocumentData, id: string): ParsedTarotRecord {
  if (data.id !== id || typeof data.groupId !== "string") {
    throw new Error(`抽牌紀錄 ${id} 的資料格式不正確。`);
  }
  return {
    ...data,
    id,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  } as ParsedTarotRecord;
}

function toGroupSummary(data: DocumentData, id: string): TarotRecordGroupSummary {
  return {
    groupId: id,
    groupTitle: String(data.groupTitle ?? ""),
    observationDate: String(data.observationDate ?? ""),
    observationTime: String(data.observationTime ?? ""),
    observationDateTime: String(data.observationDateTime ?? ""),
    recordCount: Number(data.recordCount ?? 0),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function validateGroup(group: ParsedTarotGroup): void {
  if (group.records.length !== 5) throw new Error("每個題組必須正好包含5筆抽牌紀錄。");
  const orders = group.records.map((record) => record.questionOrder);
  if (new Set(orders).size !== 5 || ![1, 2, 3, 4, 5].every((order) => orders.includes(order))) {
    throw new Error("題序必須完整且固定為1至5。");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(group.observationDate) || !/^\d{2}:\d{2}$/.test(group.observationTime)) {
    throw new Error("日期時間格式無效，無法儲存。");
  }
  if (!group.records.every((record) => record.groupId === group.groupId)) {
    throw new Error("五筆紀錄必須共用同一個 groupId。");
  }
  if (new Set(group.records.map((record) => record.id)).size !== 5) {
    throw new Error("五筆紀錄的 id 必須各自唯一。");
  }
}

export class TarotRecordRepository {
  constructor(private readonly database: Firestore) {}

  private groupRef(groupId: string) {
    return doc(this.database, GROUP_COLLECTION, groupId);
  }

  private recordRef(recordId: string) {
    return doc(this.database, RECORD_COLLECTION, recordId);
  }

  async saveGroup(group: ParsedTarotGroup): Promise<ParsedTarotGroup> {
    validateGroup(group);
    const resolvedGroupId = await resolveUniqueGroupId(group.groupId, async (candidate) => (
      (await getDocFromServer(this.groupRef(candidate))).exists()
    ));
    const batch = writeBatch(this.database);
    const timestamp = serverTimestamp();
    const storedRecords = group.records.map((record) => ({
      ...record,
      id: `${resolvedGroupId}-${String(record.questionOrder).padStart(2, "0")}`,
      groupId: resolvedGroupId,
      cardName: record.normalizedCardName,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    batch.set(this.groupRef(resolvedGroupId), {
      groupId: resolvedGroupId,
      groupTitle: group.groupTitle,
      observationDate: group.observationDate,
      observationTime: group.observationTime,
      observationDateTime: group.observationDateTime,
      recordCount: storedRecords.length,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    for (const record of storedRecords) batch.set(this.recordRef(record.id), record);
    await batch.commit();

    const now = new Date().toISOString();
    return {
      ...group,
      groupId: resolvedGroupId,
      records: group.records.map((record) => ({
        ...record,
        id: `${resolvedGroupId}-${String(record.questionOrder).padStart(2, "0")}`,
        groupId: resolvedGroupId,
        cardName: record.normalizedCardName,
        createdAt: now,
        updatedAt: now,
      })),
    };
  }

  async listRecords(): Promise<ParsedTarotRecord[]> {
    const snapshot = await getDocsFromServer(query(
      collection(this.database, RECORD_COLLECTION),
      orderBy("observationDateTime", "desc"),
    ));
    return snapshot.docs.map((item) => toRecord(item.data(), item.id));
  }

  async listGroups(): Promise<TarotRecordGroupSummary[]> {
    const snapshot = await getDocsFromServer(query(
      collection(this.database, GROUP_COLLECTION),
      orderBy("observationDateTime", "desc"),
    ));
    return snapshot.docs.map((item) => toGroupSummary(item.data(), item.id));
  }

  async updateRecord(recordId: string, fields: TarotRecordEditableFields): Promise<ParsedTarotRecord> {
    const questionText = fields.questionText.trim();
    if (!questionText) throw new Error("題目文字不可空白。");
    const metadata = getTarotCardMetadata(fields.cardName);
    if (!metadata) throw new Error(`牌名「${fields.cardName}」不在標準78張牌中。`);
    const reference = this.recordRef(recordId);
    const snapshot = await getDocFromServer(reference);
    if (!snapshot.exists()) throw new Error("找不到要修改的抽牌紀錄。");
    const current = toRecord(snapshot.data(), snapshot.id);
    const orientationLabel: TarotOrientationLabel = fields.orientation === "upright" ? "正位" : "逆位";
    const patch = {
      questionText,
      cardName: metadata.name,
      normalizedCardName: metadata.name,
      arcanaType: metadata.arcanaType,
      suit: metadata.suit,
      rank: metadata.rank,
      orientation: fields.orientation,
      orientationLabel,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(reference, patch);
    return { ...current, ...patch, updatedAt: new Date().toISOString() };
  }

  async deleteRecord(recordId: string): Promise<void> {
    const recordRef = this.recordRef(recordId);
    const recordSnapshot = await getDocFromServer(recordRef);
    if (!recordSnapshot.exists()) return;
    const record = toRecord(recordSnapshot.data(), recordSnapshot.id);
    const groupRef = this.groupRef(record.groupId);
    const groupSnapshot = await getDocFromServer(groupRef);
    const batch = writeBatch(this.database);
    batch.delete(recordRef);
    if (groupSnapshot.exists()) {
      batch.update(groupRef, {
        recordCount: Math.max(0, Number(groupSnapshot.data().recordCount ?? 1) - 1),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  async deleteGroup(groupId: string): Promise<number> {
    const snapshot = await getDocsFromServer(query(
      collection(this.database, RECORD_COLLECTION),
      where("groupId", "==", groupId),
    ));
    const batch = writeBatch(this.database);
    snapshot.docs.forEach((item) => batch.delete(item.ref));
    batch.delete(this.groupRef(groupId));
    await batch.commit();
    return snapshot.size;
  }
}

export const tarotRecordFirestorePaths = {
  records: "tarotRecords/{recordId}",
  groups: "tarotRecordGroups/{groupId}",
} as const;
