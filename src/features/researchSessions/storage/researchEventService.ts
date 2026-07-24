import type { Auth } from "firebase/auth";
import { getFirebaseAuth, getFirestoreDatabase } from "../../../lib/firebase";
import type { ResearchEventInput } from "../logic/researchSessionEvents";
import type { ResearchEventRecord } from "../types/researchSession";
import { ResearchEventRepository } from "./researchEventRepository";

export class ResearchEventService {
  constructor(
    private readonly auth: Auth,
    private readonly repository: ResearchEventRepository,
  ) {}

  private ownerId(): string {
    const ownerId = this.auth.currentUser?.uid;
    if (!ownerId) throw new Error("請先登入才能存取現實事件。");
    return ownerId;
  }

  list(sessionId: string): Promise<ResearchEventRecord[]> {
    return this.repository.list(this.ownerId(), sessionId);
  }

  create(sessionId: string, input: ResearchEventInput): Promise<ResearchEventRecord> {
    return this.repository.create(this.ownerId(), sessionId, input);
  }

  update(
    sessionId: string,
    eventId: string,
    input: ResearchEventInput,
  ): Promise<ResearchEventRecord> {
    return this.repository.update(this.ownerId(), sessionId, eventId, input);
  }
}

let defaultService: ResearchEventService | undefined;

export function getResearchEventService(): ResearchEventService {
  if (!defaultService) {
    defaultService = new ResearchEventService(
      getFirebaseAuth(),
      new ResearchEventRepository(getFirestoreDatabase()),
    );
  }
  return defaultService;
}
