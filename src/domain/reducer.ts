import type {
  ActivityEvent,
  GoalConfiguration,
  PetMood,
  PetState,
  Strictness,
  WisdomStage,
} from "./model";
import { nextPeriodKey, periodKey, weekdayForDateKey } from "./time";

const MAX_PROCESSED_IDS = 500;

export function defaultGoal(now = new Date()): GoalConfiguration {
  return {
    mode: "streak",
    metric: "accepted_problems",
    target: 1,
    period: "day",
    committedDays: [0, 1, 2, 3, 4, 5, 6],
    strictness: "standard",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    startedAt: now.toISOString(),
  };
}

export function createInitialState(
  goal = defaultGoal(),
  now = new Date(),
): PetState {
  return {
    schemaVersion: 1,
    wisdomXp: 0,
    vitality: 70,
    bond: 50,
    currentStreak: 0,
    longestStreak: 0,
    totalAccepted: 0,
    totalFocusSeconds: 0,
    goal,
    progress: {
      key: periodKey(now, goal.timezone, goal.period),
      value: 0,
    },
    lastGoalOutcome: "none",
    processedEventIds: [],
  };
}

export function applyEvent(previous: PetState, event: ActivityEvent): PetState {
  if (previous.processedEventIds.includes(event.id)) return previous;

  let state = rollForward(previous, event.occurredAt);
  const progressAmount = progressForEvent(state.goal, event);
  const wisdom = wisdomForEvent(event);
  const vitality = vitalityForEvent(event);

  state = {
    ...state,
    wisdomXp: state.wisdomXp + wisdom,
    vitality: clamp(state.vitality + vitality, 0, 100),
    totalAccepted:
      state.totalAccepted +
      (event.type === "SUBMISSION_RECORDED" && event.result === "accepted" ? 1 : 0),
    totalFocusSeconds:
      state.totalFocusSeconds + (event.type === "FOCUS_RECORDED" ? event.seconds : 0),
    progress: {
      ...state.progress,
      value: state.progress.value + progressAmount,
    },
    lastEventType: event.type,
    lastActiveAt: event.occurredAt,
    processedEventIds: [...state.processedEventIds, event.id].slice(-MAX_PROCESSED_IDS),
  };

  return state;
}

export function rollForward(previous: PetState, now: string | Date): PetState {
  const goal = previous.goal;
  const currentKey = periodKey(now, goal.timezone, goal.period);
  if (previous.progress.key >= currentKey) return previous;

  let state = previous;
  let key = state.progress.key;

  while (key < currentKey) {
    const shouldEvaluate =
      goal.period === "week" || goal.committedDays.includes(weekdayForDateKey(key));

    if (shouldEvaluate) {
      state = closeProgressWindow(state);
    }

    key = nextPeriodKey(key, goal.period);
    state = { ...state, progress: { key, value: 0 } };
  }

  return state;
}

function closeProgressWindow(state: PetState): PetState {
  if (state.progress.value >= state.goal.target) {
    const streak = state.currentStreak + 1;
    return {
      ...state,
      currentStreak: streak,
      longestStreak: Math.max(state.longestStreak, streak),
      vitality: clamp(state.vitality + 6, 0, 100),
      bond: clamp(state.bond + 3, 0, 100),
      lastGoalOutcome: "met",
    };
  }

  const penalty = penaltyFor(state.goal.strictness);
  return {
    ...state,
    currentStreak: state.goal.mode === "streak" ? 0 : state.currentStreak,
    vitality: clamp(state.vitality - penalty.vitality, 0, 100),
    bond: clamp(state.bond - penalty.bond, 0, 100),
    lastGoalOutcome: "missed",
  };
}

function penaltyFor(strictness: Strictness): { vitality: number; bond: number } {
  if (strictness === "gentle") return { vitality: 8, bond: 2 };
  if (strictness === "strict") return { vitality: 22, bond: 8 };
  return { vitality: 15, bond: 5 };
}

function progressForEvent(goal: GoalConfiguration, event: ActivityEvent): number {
  if (goal.metric === "sessions" && event.type === "SESSION_STARTED") return 1;
  if (goal.metric === "focused_minutes" && event.type === "FOCUS_RECORDED") {
    return event.seconds / 60;
  }
  if (
    goal.metric === "accepted_problems" &&
    event.type === "SUBMISSION_RECORDED" &&
    event.result === "accepted"
  ) {
    return 1;
  }
  return 0;
}

function wisdomForEvent(event: ActivityEvent): number {
  if (event.type === "FOCUS_RECORDED") return Math.floor(event.seconds / 300);
  if (event.type === "REVIEW_COMPLETED") return 12;
  if (event.type !== "SUBMISSION_RECORDED") return 0;
  if (event.result !== "accepted") return 1;
  return { easy: 10, medium: 25, hard: 50 }[event.difficulty];
}

function vitalityForEvent(event: ActivityEvent): number {
  if (event.type === "SESSION_STARTED") return 2;
  if (event.type === "FOCUS_RECORDED") return Math.min(2, event.seconds / 600);
  if (event.type === "SUBMISSION_RECORDED" && event.result === "accepted") return 8;
  return 0;
}

export function updateGoal(previous: PetState, goal: GoalConfiguration, now = new Date()): PetState {
  return {
    ...previous,
    goal: { ...goal, target: Math.max(1, goal.target), startedAt: now.toISOString() },
    progress: {
      key: periodKey(now, goal.timezone, goal.period),
      value: 0,
    },
    lastGoalOutcome: "none",
  };
}

export function getWisdomStage(xp: number): WisdomStage {
  if (xp >= 2_000) return "Sage";
  if (xp >= 800) return "Mentor";
  if (xp >= 300) return "Researcher";
  if (xp >= 80) return "Student";
  return "Hatchling";
}

export function getMood(state: PetState): PetMood {
  if (state.lastGoalOutcome === "missed") return "disappointed";
  if (state.vitality <= 30) return "tired";
  if (state.vitality >= 80) return "bright";
  return "content";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

