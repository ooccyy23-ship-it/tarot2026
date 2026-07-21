import type { QuestionGroup } from "../../questionGroups/types/questionGroup";
import type { SettingRecord } from "../storage/database";
import type { Observation } from "../types/observation";

export type DataSnapshot = {
  observations: Observation[];
  questionGroups: QuestionGroup[];
  settings: SettingRecord[];
};

export type DataExportBundle = DataSnapshot & {
  schemaVersion: 1;
  exportedAt: string;
  app: "tarot-observation-v2";
};

export type ImportPreview = DataSnapshot & {
  skipped: number;
  warnings: string[];
};

export type ImportRepository = {
  snapshot(): Promise<DataSnapshot>;
  saveObservation(observation: Observation): Promise<void>;
  saveQuestionGroup(group: QuestionGroup): Promise<void>;
  saveSetting(key: string, value: unknown): Promise<void>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuestionGroup(value: unknown): value is QuestionGroup {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.category !== "string" || typeof value.title !== "string" || !Array.isArray(value.questions)) return false;
  if ((value.source !== "historical" && value.source !== "custom") || typeof value.active !== "boolean" || typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") return false;
  return value.questions.length === 5 && value.questions.every((question) => isRecord(question)
    && typeof question.id === "string" && typeof question.order === "number" && typeof question.title === "string");
}

function isObservation(value: unknown): value is Observation {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.id !== "string") return false;
  if (typeof value.observationDate !== "string" || typeof value.drawTime !== "string" || typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") return false;
  if (typeof value.questionGroupId !== "string" || typeof value.weekday !== "number" || typeof value.weekdayLabel !== "string") return false;
  if (!isQuestionGroup(value.questionGroupSnapshot) || !isRecord(value.drawResult) || !Array.isArray(value.drawResult.cards) || value.drawResult.cards.length !== 5 || !Array.isArray(value.drawResult.sequences)) return false;
  if (!isRecord(value.preEmotion) || !Array.isArray(value.interpretations) || !isRecord(value.overallInterpretation) || !isRecord(value.verification)) return false;
  return ["required", "not_required", "uncertain"].includes(String(value.verification.requirement))
    && ["pending", "verified", "overdue", "not_applicable"].includes(String(value.verification.status));
}

function isSetting(value: unknown): value is SettingRecord {
  return isRecord(value) && typeof value.key === "string" && "value" in value;
}

export function createExportBundle(snapshot: DataSnapshot, now = new Date()): DataExportBundle {
  return {
    schemaVersion: 1,
    app: "tarot-observation-v2",
    exportedAt: now.toISOString(),
    observations: structuredClone(snapshot.observations),
    questionGroups: structuredClone(snapshot.questionGroups),
    settings: structuredClone(snapshot.settings),
  };
}

export function serializeData(snapshot: DataSnapshot, now = new Date()): string {
  return JSON.stringify(createExportBundle(snapshot, now), null, 2);
}

export function parseImportJson(text: string): ImportPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("無法解析 JSON，既有資料未變更。");
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || parsed.app !== "tarot-observation-v2") {
    throw new Error("JSON schemaVersion 或資料格式不相容，既有資料未變更。");
  }
  if (!Array.isArray(parsed.observations) || !Array.isArray(parsed.questionGroups) || !Array.isArray(parsed.settings)) {
    throw new Error("JSON 缺少必要資料集合，既有資料未變更。");
  }

  const observations = parsed.observations.filter(isObservation);
  const questionGroups = parsed.questionGroups.filter(isQuestionGroup);
  const settings = parsed.settings.filter(isSetting);
  const skipped = parsed.observations.length - observations.length
    + parsed.questionGroups.length - questionGroups.length
    + parsed.settings.length - settings.length;
  return {
    observations,
    questionGroups,
    settings,
    skipped,
    warnings: skipped > 0 ? [`已略過 ${skipped} 筆格式不正確的資料。`] : [],
  };
}

export async function importDataFromJson(
  text: string,
  repository: ImportRepository,
  now = new Date(),
): Promise<ImportPreview & { backupKey: string; imported: { observations: number; questionGroups: number; settings: number } }> {
  const preview = parseImportJson(text);
  const backupKey = `import-backup-${now.toISOString()}`;
  const current = await repository.snapshot();
  const backupSnapshot = { ...current, settings: current.settings.filter((setting) => !setting.key.startsWith("import-backup-")) };
  await repository.saveSetting(backupKey, createExportBundle(backupSnapshot, now));

  let failed = 0;
  let importedObservations = 0;
  let importedQuestionGroups = 0;
  let importedSettings = 0;
  for (const observation of preview.observations) {
    try { await repository.saveObservation(observation); importedObservations += 1; } catch { failed += 1; }
  }
  for (const group of preview.questionGroups) {
    try { await repository.saveQuestionGroup(group); importedQuestionGroups += 1; } catch { failed += 1; }
  }
  for (const setting of preview.settings) {
    try { await repository.saveSetting(setting.key, setting.value); importedSettings += 1; } catch { failed += 1; }
  }
  return {
    ...preview,
    skipped: preview.skipped + failed,
    warnings: failed > 0 ? [...preview.warnings, `${failed} 筆資料寫入失敗，其餘有效資料已保留。`] : preview.warnings,
    backupKey,
    imported: { observations: importedObservations, questionGroups: importedQuestionGroups, settings: importedSettings },
  };
}
