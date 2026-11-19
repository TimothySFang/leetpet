import { browser } from "wxt/browser";
import type { ExtensionMessage, ExtensionResponse } from "../domain/messages";
import type { ActivityEvent, GoalConfiguration, StateView } from "../domain/model";

async function send(message: ExtensionMessage): Promise<StateView> {
  const response = (await browser.runtime.sendMessage(message)) as ExtensionResponse;
  if (!response?.ok || !response.view) {
    throw new Error(response?.error ?? "LeetPet did not return a state.");
  }
  return response.view;
}

export const extensionClient = {
  getState: () => send({ type: "GET_STATE" }),
  tick: () => send({ type: "TICK" }),
  record: (event: ActivityEvent) => send({ type: "RECORD_ACTIVITY", event }),
  updateGoal: (goal: GoalConfiguration) => send({ type: "UPDATE_GOAL", goal }),
};

