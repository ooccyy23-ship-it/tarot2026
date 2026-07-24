import type { Auth } from "firebase/auth";
import { getFirebaseAuth, getFirestoreDatabase } from "../../../lib/firebase";
import type {
  ResearchSession,
  ResearchSessionStatus,
  SessionQuestionGroupDrawResult,
} from "../types/researchSession";
import {
  SevenDaySessionRepository,
  type CreateSevenDaySessionResult,
  type SaveLockedSetResult,
} from "./sevenDaySessionRepository";

export class SevenDaySessionService {
  private createInFlight: Promise<CreateSevenDaySessionResult> | null = null;

  constructor(
    private readonly auth: Auth,
    private readonly repository: SevenDaySessionRepository,
  ) {}

  private ownerId(): string {
    const ownerId = this.auth.currentUser?.uid;
    if (!ownerId) throw new Error("請先登入後再操作研究 Session。");
    return ownerId;
  }

  create(startDate: string): Promise<CreateSevenDaySessionResult> {
    if (this.createInFlight) return this.createInFlight;
    this.createInFlight = this.repository.create(this.ownerId(), startDate)
      .finally(() => {
        this.createInFlight = null;
      });
    return this.createInFlight;
  }

  get(sessionId: string): Promise<ResearchSession | undefined> {
    return this.repository.get(this.ownerId(), sessionId);
  }

  list(): Promise<ResearchSession[]> {
    return this.repository.list(this.ownerId());
  }

  updateStatus(
    sessionId: string,
    nextStatus: Exclude<ResearchSessionStatus, "invalid">,
  ): Promise<void> {
    return this.repository.updateStatus(this.ownerId(), sessionId, nextStatus);
  }

  saveLockedSet(
    sessionId: string,
    result: SessionQuestionGroupDrawResult,
  ): Promise<SaveLockedSetResult> {
    return this.repository.saveLockedSet(this.ownerId(), sessionId, result);
  }

  markInvalid(sessionId: string, reason: string): Promise<void> {
    return this.repository.markInvalid(this.ownerId(), sessionId, reason);
  }
}

let defaultService: SevenDaySessionService | undefined;

export function getSevenDaySessionService(): SevenDaySessionService {
  if (!defaultService) {
    defaultService = new SevenDaySessionService(
      getFirebaseAuth(),
      new SevenDaySessionRepository(getFirestoreDatabase()),
    );
  }
  return defaultService;
}
