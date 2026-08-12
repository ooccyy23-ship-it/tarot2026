import type { Auth } from "firebase/auth";
import { getAllowedUid, isAllowedUid } from "../../auth/authAccess";
import { getFirebaseAuth, getFirestoreDatabase } from "../../../lib/firebase";
import type {
  ParsedTarotGroup,
  ParsedTarotRecord,
  TarotRecordEditableFields,
  TarotRecordGroupSummary,
  TarotRecordDuplicate,
} from "../types/tarotRecord";
import { TarotRecordRepository } from "./tarotRecordRepository";

export class TarotRecordService {
  constructor(
    private readonly auth: Auth,
    private readonly repository: TarotRecordRepository,
  ) {}

  private assertAuthorized(): void {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error("請先登入才能存取抽牌紀錄。");
    if (!isAllowedUid(uid, getAllowedUid())) throw new Error("此帳號沒有抽牌紀錄使用權限。");
  }

  saveGroup(group: ParsedTarotGroup): Promise<ParsedTarotGroup> {
    this.assertAuthorized();
    return this.repository.saveGroup(group);
  }

  findDuplicateGroup(group: ParsedTarotGroup): Promise<TarotRecordDuplicate | null> {
    this.assertAuthorized();
    return this.repository.findDuplicateGroup(group);
  }

  getRecord(recordId: string): Promise<ParsedTarotRecord | null> {
    this.assertAuthorized();
    return this.repository.getRecord(recordId);
  }

  listRecords(): Promise<ParsedTarotRecord[]> {
    this.assertAuthorized();
    return this.repository.listRecords();
  }

  listGroups(): Promise<TarotRecordGroupSummary[]> {
    this.assertAuthorized();
    return this.repository.listGroups();
  }

  updateRecord(recordId: string, fields: TarotRecordEditableFields): Promise<ParsedTarotRecord> {
    this.assertAuthorized();
    return this.repository.updateRecord(recordId, fields);
  }

  deleteRecord(recordId: string): Promise<void> {
    this.assertAuthorized();
    return this.repository.deleteRecord(recordId);
  }

  deleteGroup(groupId: string): Promise<number> {
    this.assertAuthorized();
    return this.repository.deleteGroup(groupId);
  }
}

let defaultService: TarotRecordService | undefined;

export function getTarotRecordService(): TarotRecordService {
  if (!defaultService) {
    defaultService = new TarotRecordService(
      getFirebaseAuth(),
      new TarotRecordRepository(getFirestoreDatabase()),
    );
  }
  return defaultService;
}
