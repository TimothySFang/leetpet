import type { ActivityEvent, GoalConfiguration, StateView } from "./model";

export type ExtensionMessage =
  | { type: "GET_STATE" }
  | { type: "RECORD_ACTIVITY"; event: ActivityEvent }
  | { type: "UPDATE_GOAL"; goal: GoalConfiguration }
  | { type: "TICK" };

export interface ExtensionResponse {
  ok: boolean;
  view?: StateView;
  error?: string;
}

