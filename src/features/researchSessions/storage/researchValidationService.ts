import type { Auth } from "firebase/auth";
import { getFirebaseAuth, getFirestoreDatabase } from "../../../lib/firebase";
import type { ResearchQuestionValidationInput } from "../logic/researchSessionValidation";
import type {
  ResearchQuestionValidationRecord,
  ResearchSetCode,
} from "../types/researchSession";
import { ResearchValidationRepository } from "./researchValidationRepository";

export class ResearchValidationService {
  private completionInFlight: Promise<void> | null = null;

  constructor(
    private readonly auth: Auth,
    private readonly repository: ResearchValidationRepository,
  ) {}

  private ownerId(): string {
    const ownerId = this.auth.currentUser?.uid;
    if (!ownerId) throw new Error("請先登入再管理最終驗證。");
    return ownerId;
  }

  list(sessionId: string): Promise<ResearchQuestionValidationRecord[]> {
    return this.repository.list(this.ownerId(), sessionId);
  }

  save(
    sessionId: string,
    setId: ResearchSetCode,
    questionIndex: number,
    input: ResearchQuestionValidationInput,
  ): Promise<ResearchQuestionValidationRecord> {
    return this.repository.save(
      this.ownerId(),
      sessionId,
      setId,
      questionIndex,
      input,
    );
  }

  complete(sessionId: string): Promise<void> {
    if (this.completionInFlight) return this.completionInFlight;
    this.completionInFlight = this.repository.complete(this.ownerId(), sessionId)
      .finally(() => {
        this.completionInFlight = null;
      });
    return this.completionInFlight;
  }
}

let defaultService: ResearchValidationService | undefined;

export function getResearchValidationService(): ResearchValidationService {
  if (!defaultService) {
    defaultService = new ResearchValidationService(
      getFirebaseAuth(),
      new ResearchValidationRepository(getFirestoreDatabase()),
    );
  }
  return defaultService;
}
