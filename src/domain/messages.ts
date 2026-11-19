import type { ActivityEvent, GoalConfiguration, StateView } from "./model";
import type { AccountView, OnboardingState } from "../accounts/model";

export type ExtensionMessage =
  | { type: "GET_STATE" }
  | { type: "RECORD_ACTIVITY"; event: ActivityEvent }
  | { type: "UPDATE_GOAL"; goal: GoalConfiguration }
  | { type: "GET_ACCOUNT" }
  | { type: "SIGN_IN_GOOGLE" }
  | { type: "SIGN_OUT" }
  | { type: "SAVE_ONBOARDING"; onboarding: OnboardingState }
  | { type: "COMPLETE_ONBOARDING"; accountChoice: "google" | "guest" }
  | { type: "TICK" };

export interface ExtensionResponse {
  ok: boolean;
  view?: StateView;
  accountView?: AccountView;
  error?: string;
}

