import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
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
import { createTarotRecordCompatibilityFingerprint } from "../logic/tarotRecordFingerprint";
import type {
  ParsedTarotGroup,
  ParsedTarotRecord,
  TarotRecordEditableFields,
  TarotRecordGroupSummary,
  TarotRecordDuplicate,
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
    recordType: data.recordType === "open_observation" ? "open_observation" : "questioned",
    questionText: typeof data.questionText === "string" ? data.questionText : "",
    position: Number(data.position ?? data.questionOrder ?? 0) || undefined,
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
    importSource: data.importSource,
    drawResultId: typeof data.drawResultId === "string" ? data.drawResultId : undefined,
    fingerprint: typeof data.fingerprint === "string" ? data.fingerprint : undefined,
    recordType: data.recordType === "open_observation" ? "open_observation" : "questioned",
    observationCode: typeof data.observationCode === "string" ? data.observationCode : undefined,
    drawMethod: typeof data.drawMethod === "string" ? data.drawMethod : undefined,
    note: typeof data.note === "string" ? data.note : undefined,
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
  const recordType = group.recordType ?? "questioned";
  if (recordType === "open_observation") {
    if (!group.observationCode?.trim()) throw new Error("無題觀測缺少觀測編號。");
    if (!group.records.every((record) => !record.questionText.trim())) {
      throw new Error("無題觀測不得包含題目文字。");
    }
  } else if (!group.records.every((record) => record.questionText.trim())) {
    throw new Error("題組觀測的題目文字不可空白。");
  }
  if (!group.records.every((record) => getTarotCardMetadata(record.cardName))) {
    throw new Error("五張牌都必須是標準78張牌中的有效牌名。");
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
    const recordType = group.recordType ?? "questioned";
    const storedRecords = group.records.map((record) => ({
      ...record,
      id: `${resolvedGroupId}-${String(record.questionOrder).padStart(2, "0")}`,
      groupId: resolvedGroupId,
      recordType,
      observationCode: group.observationCode ?? null,
      position: record.questionOrder,
      weekdayLabel: group.weekdayLabel ?? null,
      drawMethod: group.drawMethod ?? null,
      note: group.note ?? "",
      cardName: record.normalizedCardName,
      importSource: group.importSource ?? "manual_text",
      drawResultId: group.drawResultId ?? null,
      fingerprint: group.fingerprint ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    batch.set(this.groupRef(resolvedGroupId), {
      groupId: resolvedGroupId,
      groupTitle: group.groupTitle,
      recordType,
      observationCode: group.observationCode ?? null,
      observationDate: group.observationDate,
      observationTime: group.observationTime,
      observationDateTime: group.observationDateTime,
      recordCount: storedRecords.length,
      importSource: group.importSource ?? "manual_text",
      drawResultId: group.drawResultId ?? null,
      sourceQuestionGroupId: group.sourceQuestionGroupId ?? null,
      drawMode: group.drawMode ?? null,
      weekdayLabel: group.weekdayLabel ?? null,
      sequences: group.sequences ?? null,
      drawMethod: group.drawMethod ?? null,
      note: group.note ?? "",
      fingerprint: group.fingerprint ?? null,
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

  async findDuplicateGroup(group: ParsedTarotGroup): Promise<TarotRecordDuplicate | null> {
    const checks: Array<["drawResultId" | "fingerprint", string | undefined]> = [
      ["drawResultId", group.drawResultId],
      ["fingerprint", group.fingerprint],
    ];
    for (const [field, value] of checks) {
      if (!value) continue;
      const snapshot = await getDocsFromServer(query(
        collection(this.database, GROUP_COLLECTION),
        where(field, "==", value),
        limit(1),
      ));
      const match = snapshot.docs[0];
      if (match) return toGroupSummary(match.data(), match.id);
    }
    const sameTime = await getDocsFromServer(query(
      collection(this.database, GROUP_COLLECTION),
      where("observationDateTime", "==", group.observationDateTime),
    ));
    const expectedCompatibilityFingerprint = createTarotRecordCompatibilityFingerprint(group);
    for (const groupDocument of sameTime.docs) {
      const summary = toGroupSummary(groupDocument.data(), groupDocument.id);
      if (summary.groupTitle !== group.groupTitle) continue;
      const recordSnapshot = await getDocsFromServer(query(
        collection(this.database, RECORD_COLLECTION),
        where("groupId", "==", summary.groupId),
      ));
      const storedRecords = recordSnapshot.docs.map((item) => toRecord(item.data(), item.id));
      if (storedRecords.length !== 5) continue;
      const compatibilityFingerprint = createTarotRecordCompatibilityFingerprint({
        observationDate: summary.observationDate,
        observationTime: summary.observationTime,
        groupTitle: summary.groupTitle,
        records: storedRecords,
      });
      if (compatibilityFingerprint === expectedCompatibilityFingerprint) return summary;
    }
    return null;
  }

  async getRecord(recordId: string): Promise<ParsedTarotRecord | null> {
    const snapshot = await getDocFromServer(this.recordRef(recordId));
    return snapshot.exists() ? toRecord(snapshot.data(), snapshot.id) : null;
  }

  async listRecords(): Promise<ParsedTarotRecord[]> {
    const snapshot = await getDocsFromServer(query(
      collection(this.database, RECORD_COLLECTION),
      orderBy("observationDateTime", "desc"),
    ));
    return snapshot.docs.map((item) => toRecord(item.data(), item.id));
  }

  async listRecordsByGroup(groupId: string): Promise<ParsedTarotRecord[]> {
    const snapshot = await getDocsFromServer(query(
      collection(this.database, RECORD_COLLECTION),
      where("groupId", "==", groupId),
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
    const metadata = getTarotCardMetadata(fields.cardName);
    if (!metadata) throw new Error(`牌名「${fields.cardName}」不在標準78張牌中。`);
    const reference = this.recordRef(recordId);
    const snapshot = await getDocFromServer(reference);
    if (!snapshot.exists()) throw new Error("找不到要修改的抽牌紀錄。");
    const current = toRecord(snapshot.data(), snapshot.id);
    const questionText = current.recordType === "open_observation" ? "" : fields.questionText.trim();
    if (current.recordType !== "open_observation" && !questionText) throw new Error("題目文字不可空白。");
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

  async updateOpenObservationNote(groupId: string, note: string): Promise<void> {
    const reference = this.groupRef(groupId);
    const snapshot = await getDocFromServer(reference);
    if (!snapshot.exists()) throw new Error("找不到這筆無題觀測。");
    const summary = toGroupSummary(snapshot.data(), snapshot.id);
    if (summary.recordType !== "open_observation") throw new Error("只有無題觀測可以在此修改備註。");
    const trimmed = note.trim();
    const records = await getDocsFromServer(query(collection(this.database, RECORD_COLLECTION), where("groupId", "==", groupId)));
    const batch = writeBatch(this.database);
    batch.update(reference, { note: trimmed, updatedAt: serverTimestamp() });
    records.docs.forEach((item) => batch.update(item.ref, { note: trimmed, updatedAt: serverTimestamp() }));
    await batch.commit();
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
