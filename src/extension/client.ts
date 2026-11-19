import { browser } from "wxt/browser";
import type { ExtensionMessage, ExtensionResponse } from "../domain/messages";
import type { ActivityEvent, GoalConfiguration, StateView } from "../domain/model";
import type { AccountView, OnboardingState } from "../accounts/model";

async function send(message: ExtensionMessage): Promise<StateView> {
  const response = (await browser.runtime.sendMessage(message)) as ExtensionResponse;
  if (!response?.ok || !response.view) {
    throw new Error(response?.error ?? "LeetPet did not return a state.");
  }
  return response.view;
}

async function sendAccount(message: ExtensionMessage): Promise<AccountView> {
  const response = (await browser.runtime.sendMessage(message)) as ExtensionResponse;
  if (!response?.ok || !response.accountView) {
    throw new Error(response?.error ?? "LeetPet did not return an account state.");
  }
  return response.accountView;
}

export const extensionClient = {
  getState: () => send({ type: "GET_STATE" }),
  tick: () => send({ type: "TICK" }),
  record: (event: ActivityEvent) => send({ type: "RECORD_ACTIVITY", event }),
  updateGoal: (goal: GoalConfiguration) => send({ type: "UPDATE_GOAL", goal }),
  getAccount: () => sendAccount({ type: "GET_ACCOUNT" }),
  signInWithGoogle: () => sendAccount({ type: "SIGN_IN_GOOGLE" }),
  signOut: () => sendAccount({ type: "SIGN_OUT" }),
  saveOnboarding: (onboarding: OnboardingState) =>
    sendAccount({ type: "SAVE_ONBOARDING", onboarding }),
  completeOnboarding: (accountChoice: "google" | "guest") =>
    sendAccount({ type: "COMPLETE_ONBOARDING", accountChoice }),
};

