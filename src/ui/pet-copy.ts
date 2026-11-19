import type { StateView } from "../domain/model";

export function petEmoji(view: StateView): string {
  const stage = view.wisdomStage;
  if (stage === "Sage") return "🦉";
  if (stage === "Mentor") return "🦊";
  if (stage === "Researcher") return "🐱";
  if (stage === "Student") return "🐣";
  return "🥚";
}

export function petMessage(view: StateView): string {
  const { state, mood } = view;
  if (state.lastEventType === "SUBMISSION_RECORDED" && state.lastGoalOutcome !== "missed") {
    return "That was real progress. Let it settle in.";
  }
  if (mood === "disappointed") {
    return "We missed our promise. One focused session can rebuild our momentum.";
  }
  if (mood === "tired") {
    return "Our energy is low. A small problem—or a proper rest—would help.";
  }
  if (mood === "bright") return "I’m feeling sharp. Let’s learn something interesting!";
  return "I’m here when you’re ready. One thoughtful attempt counts.";
}

