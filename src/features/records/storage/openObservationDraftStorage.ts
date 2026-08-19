import type { OpenObservationInput } from "../logic/openObservation";

export const OPEN_OBSERVATION_PREFILL_KEY = "tarot2026:open-observation-prefill:v1";

export function saveOpenObservationPrefill(input: OpenObservationInput, storage: Storage = window.sessionStorage): void {
  storage.setItem(OPEN_OBSERVATION_PREFILL_KEY, JSON.stringify(input));
}

export function loadOpenObservationPrefill(storage: Storage = window.sessionStorage): OpenObservationInput | null {
  try {
    const parsed = JSON.parse(storage.getItem(OPEN_OBSERVATION_PREFILL_KEY) ?? "null") as OpenObservationInput | null;
    return parsed && Array.isArray(parsed.cards) && parsed.cards.length === 5 ? parsed : null;
  } catch {
    return null;
  }
}

export function clearOpenObservationPrefill(storage: Storage = window.sessionStorage): void {
  storage.removeItem(OPEN_OBSERVATION_PREFILL_KEY);
}
