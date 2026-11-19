import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import type { ExtensionMessage, ExtensionResponse } from "../src/domain/messages";
import type { PetState, StateView } from "../src/domain/model";
import {
  applyEvent,
  getMood,
  getWisdomStage,
  rollForward,
  updateGoal,
} from "../src/domain/reducer";
import { loadSnapshot, saveSnapshot, saveStateWithEvent } from "../src/extension/storage";

const DAILY_CHECK_ALARM = "leetpet-daily-check";

function toView(state: PetState): StateView {
  return {
    state,
    mood: getMood(state),
    wisdomStage: getWisdomStage(state.wisdomXp),
  };
}

async function tick(): Promise<StateView> {
  const snapshot = await loadSnapshot();
  const next = rollForward(snapshot.state, new Date());
  if (next !== snapshot.state) await saveSnapshot({ ...snapshot, state: next });
  return toView(next);
}

async function handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  try {
    if (message.type === "GET_STATE" || message.type === "TICK") {
      return { ok: true, view: await tick() };
    }

    const snapshot = await loadSnapshot();

    if (message.type === "RECORD_ACTIVITY") {
      const state = applyEvent(snapshot.state, message.event);
      await saveStateWithEvent(state, message.event);
      return { ok: true, view: toView(state) };
    }

    if (message.type === "UPDATE_GOAL") {
      const state = updateGoal(snapshot.state, message.goal);
      await saveSnapshot({ ...snapshot, state });
      return { ok: true, view: toView(state) };
    }

    return { ok: false, error: "Unsupported message." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected LeetPet error.",
    };
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    await loadSnapshot();
    await browser.alarms.create(DAILY_CHECK_ALARM, { periodInMinutes: 60 });
  });

  browser.runtime.onStartup.addListener(async () => {
    const alarm = await browser.alarms.get(DAILY_CHECK_ALARM);
    if (!alarm) await browser.alarms.create(DAILY_CHECK_ALARM, { periodInMinutes: 60 });
    await tick();
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === DAILY_CHECK_ALARM) void tick();
  });

  browser.runtime.onMessage.addListener((message: ExtensionMessage) => handleMessage(message));
});

