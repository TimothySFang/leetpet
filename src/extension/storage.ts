import { browser } from "wxt/browser";
import type { ActivityEvent, LeetPetSnapshot, PetState } from "../domain/model";
import { createInitialState } from "../domain/reducer";

const SNAPSHOT_KEY = "leetpet_snapshot";
const MAX_EVENTS = 1_000;

export async function loadSnapshot(): Promise<LeetPetSnapshot> {
  const stored = await browser.storage.local.get(SNAPSHOT_KEY);
  const snapshot = stored[SNAPSHOT_KEY] as LeetPetSnapshot | undefined;
  if (snapshot?.state?.schemaVersion === 1 && Array.isArray(snapshot.events)) return snapshot;

  const initial = { state: createInitialState(), events: [] } satisfies LeetPetSnapshot;
  await saveSnapshot(initial);
  return initial;
}

export async function saveSnapshot(snapshot: LeetPetSnapshot): Promise<void> {
  await browser.storage.local.set({ [SNAPSHOT_KEY]: snapshot });
}

export async function saveStateWithEvent(state: PetState, event: ActivityEvent): Promise<void> {
  const snapshot = await loadSnapshot();
  const hasEvent = snapshot.events.some((item) => item.id === event.id);
  await saveSnapshot({
    state,
    events: hasEvent ? snapshot.events : [...snapshot.events, event].slice(-MAX_EVENTS),
  });
}

