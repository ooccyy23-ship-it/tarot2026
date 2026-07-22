import defaultQuestionGroups from "../../../data/defaultQuestionGroups.json";
import type { QuestionGroup } from "../../questionGroups/types/questionGroup";
import type { Observation } from "../types/observation";

const DB_NAME = "tarot-observation-db";
const DB_VERSION = 1;

export type SettingRecord = { key: string; value: unknown; updatedAt: string };
type StoreName = "observations" | "questionGroups" | "settings";

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("observations")) {
        database.createObjectStore("observations", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("questionGroups")) {
        database.createObjectStore("questionGroups", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("無法開啟本機資料庫"));
  });
}

async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const result = await requestToPromise(transaction.objectStore(storeName).getAll() as IDBRequest<T[]>);
  await transactionDone(transaction);
  database.close();
  return result;
}

async function put<T>(storeName: StoreName, value: T): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).put(value);
  await transactionDone(transaction);
  database.close();
}

async function getByKey<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const result = await requestToPromise(transaction.objectStore(storeName).get(key) as IDBRequest<T | undefined>);
  await transactionDone(transaction);
  database.close();
  return result;
}

async function deleteByKey(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).delete(key);
  await transactionDone(transaction);
  database.close();
}

export async function initializeDatabase(): Promise<void> {
  const existing = await listQuestionGroups();
  const existingIds = new Set(existing.map((group) => group.id));
  const defaults = defaultQuestionGroups as QuestionGroup[];
  for (const group of defaults) {
    if (!existingIds.has(group.id)) await saveQuestionGroup(group);
  }
}

export function listObservations(): Promise<Observation[]> {
  return getAll<Observation>("observations");
}

export function saveObservation(observation: Observation): Promise<void> {
  return put("observations", observation);
}

export function getObservation(id: string): Promise<Observation | undefined> {
  return getByKey<Observation>("observations", id);
}

export function deleteObservation(id: string): Promise<void> {
  return deleteByKey("observations", id);
}

export function listQuestionGroups(): Promise<QuestionGroup[]> {
  return getAll<QuestionGroup>("questionGroups");
}

export function saveQuestionGroup(group: QuestionGroup): Promise<void> {
  return put("questionGroups", group);
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const database = await openDatabase();
  const transaction = database.transaction("settings", "readonly");
  const record = await requestToPromise(
    transaction.objectStore("settings").get(key) as IDBRequest<SettingRecord | undefined>,
  );
  await transactionDone(transaction);
  database.close();
  return record?.value as T | undefined;
}

export function saveSetting(key: string, value: unknown): Promise<void> {
  return put<SettingRecord>("settings", { key, value, updatedAt: new Date().toISOString() });
}

export function deleteSetting(key: string): Promise<void> {
  return deleteByKey("settings", key);
}

export function listSettings(): Promise<SettingRecord[]> {
  return getAll<SettingRecord>("settings");
}

export async function clearAllData(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(["observations", "questionGroups", "settings"], "readwrite");
  transaction.objectStore("observations").clear();
  transaction.objectStore("questionGroups").clear();
  transaction.objectStore("settings").clear();
  await transactionDone(transaction);
  database.close();
}
