export type GoalMode = "streak" | "growth" | "adaptive";
export type GoalMetric = "accepted_problems" | "focused_minutes" | "sessions";
export type GoalPeriod = "day" | "week";
export type Strictness = "gentle" | "standard" | "strict";
export type Difficulty = "easy" | "medium" | "hard";
export type SubmissionResult =
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "timeout";

export interface GoalConfiguration {
  mode: GoalMode;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  committedDays: number[];
  strictness: Strictness;
  timezone: string;
  startedAt: string;
}

interface EventBase {
  id: string;
  occurredAt: string;
  timezone: string;
}

export type ActivityEvent =
  | (EventBase & { type: "SESSION_STARTED"; problemId: string })
  | (EventBase & { type: "FOCUS_RECORDED"; problemId: string; seconds: number })
  | (EventBase & { type: "CODE_RUN"; problemId: string })
  | (EventBase & {
      type: "SUBMISSION_RECORDED";
      problemId: string;
      result: SubmissionResult;
      difficulty: Difficulty;
    })
  | (EventBase & { type: "HINT_USED"; problemId: string; level: number })
  | (EventBase & { type: "REVIEW_COMPLETED"; problemId: string });

export type PetMood = "bright" | "content" | "tired" | "disappointed";
export type GoalOutcome = "none" | "met" | "missed";

export interface ProgressWindow {
  key: string;
  value: number;
}

export interface PetState {
  schemaVersion: 1;
  wisdomXp: number;
  vitality: number;
  bond: number;
  currentStreak: number;
  longestStreak: number;
  totalAccepted: number;
  totalFocusSeconds: number;
  goal: GoalConfiguration;
  progress: ProgressWindow;
  lastGoalOutcome: GoalOutcome;
  lastEventType?: ActivityEvent["type"];
  lastActiveAt?: string;
  processedEventIds: string[];
}

export interface LeetPetSnapshot {
  state: PetState;
  events: ActivityEvent[];
}

export interface ProblemMetadata {
  id: string;
  title: string;
  difficulty: Difficulty;
}

export interface StateView {
  state: PetState;
  mood: PetMood;
  wisdomStage: WisdomStage;
}

export type WisdomStage = "Hatchling" | "Student" | "Researcher" | "Mentor" | "Sage";

