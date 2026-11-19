import { describe, expect, it } from "vitest";
import type { ActivityEvent, GoalConfiguration } from "./model";
import { applyEvent, createInitialState, getWisdomStage, rollForward } from "./reducer";

const goal: GoalConfiguration = {
  mode: "streak",
  metric: "accepted_problems",
  target: 1,
  period: "day",
  committedDays: [0, 1, 2, 3, 4, 5, 6],
  strictness: "standard",
  timezone: "UTC",
  startedAt: "2026-01-01T00:00:00.000Z",
};

function accepted(id: string, occurredAt: string): ActivityEvent {
  return {
    id,
    type: "SUBMISSION_RECORDED",
    problemId: "two-sum",
    result: "accepted",
    difficulty: "medium",
    occurredAt,
    timezone: "UTC",
  };
}

describe("pet reducer", () => {
  it("awards wisdom and goal progress for an accepted problem", () => {
    const state = createInitialState(goal, new Date("2026-01-01T12:00:00Z"));
    const next = applyEvent(state, accepted("event-1", "2026-01-01T13:00:00Z"));

    expect(next.wisdomXp).toBe(25);
    expect(next.progress.value).toBe(1);
    expect(next.totalAccepted).toBe(1);
  });

  it("deduplicates repeated events", () => {
    const state = createInitialState(goal, new Date("2026-01-01T12:00:00Z"));
    const event = accepted("same-id", "2026-01-01T13:00:00Z");
    const once = applyEvent(state, event);
    const twice = applyEvent(once, event);

    expect(twice).toEqual(once);
  });

  it("applies a recoverable consequence after a missed day", () => {
    const state = createInitialState(goal, new Date("2026-01-01T12:00:00Z"));
    const next = rollForward(state, new Date("2026-01-02T12:00:00Z"));

    expect(next.lastGoalOutcome).toBe("missed");
    expect(next.vitality).toBe(55);
    expect(next.bond).toBe(45);
    expect(next.wisdomXp).toBe(0);
  });

  it("closes a successful day and extends the streak", () => {
    const state = createInitialState(goal, new Date("2026-01-01T12:00:00Z"));
    const practiced = applyEvent(state, accepted("event-1", "2026-01-01T13:00:00Z"));
    const next = rollForward(practiced, new Date("2026-01-02T12:00:00Z"));

    expect(next.currentStreak).toBe(1);
    expect(next.lastGoalOutcome).toBe("met");
    expect(next.wisdomXp).toBe(25);
  });

  it("maps permanent wisdom into visual stages", () => {
    expect(getWisdomStage(0)).toBe("Hatchling");
    expect(getWisdomStage(80)).toBe("Student");
    expect(getWisdomStage(2_000)).toBe("Sage");
  });
});
