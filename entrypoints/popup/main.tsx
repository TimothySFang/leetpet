import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  GoalConfiguration,
  GoalMetric,
  GoalMode,
  GoalPeriod,
  StateView,
  Strictness,
} from "../../src/domain/model";
import { extensionClient } from "../../src/extension/client";
import { petEmoji, petMessage } from "../../src/ui/pet-copy";
import "./style.css";

function App() {
  const [view, setView] = useState<StateView | null>(null);
  const [goal, setGoal] = useState<GoalConfiguration | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void extensionClient.getState().then((next) => {
      setView(next);
      setGoal(next.state.goal);
    }).catch((cause: unknown) => setError(String(cause)));
  }, []);

  async function saveGoal(event: React.FormEvent) {
    event.preventDefault();
    if (!goal) return;
    try {
      const next = await extensionClient.updateGoal(goal);
      setView(next);
      setGoal(next.state.goal);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1_800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the goal.");
    }
  }

  if (error) return <main><p className="error">{error}</p></main>;
  if (!view || !goal) return <main><p>Waking your pet…</p></main>;

  const progressPercent = Math.min(100, (view.state.progress.value / goal.target) * 100);

  return (
    <main>
      <header>
        <div className="pet" aria-hidden="true">{petEmoji(view)}</div>
        <div>
          <span className="kicker">{view.wisdomStage}</span>
          <h1>LeetPet</h1>
        </div>
      </header>

      <p className="message">{petMessage(view)}</p>

      <section className="summary" aria-label="Pet progress">
        <div><strong>{view.state.wisdomXp}</strong><span>Wisdom</span></div>
        <div><strong>{Math.round(view.state.vitality)}</strong><span>Vitality</span></div>
        <div><strong>{view.state.currentStreak}</strong><span>Streak</span></div>
      </section>

      <div className="progress-copy">
        <span>Current promise</span>
        <strong>{formatProgress(view.state.progress.value)} / {goal.target}</strong>
      </div>
      <div className="progress"><span style={{ width: `${progressPercent}%` }} /></div>

      <form onSubmit={saveGoal}>
        <h2>Choose how I motivate you</h2>

        <label>
          Goal style
          <select value={goal.mode} onChange={(event) => update("mode", event.target.value as GoalMode)}>
            <option value="streak">Daily streak</option>
            <option value="growth">Grow at my pace</option>
            <option value="adaptive">Adaptive coach</option>
          </select>
        </label>

        <div className="form-grid">
          <label>
            Measure
            <select value={goal.metric} onChange={(event) => update("metric", event.target.value as GoalMetric)}>
              <option value="accepted_problems">Accepted problems</option>
              <option value="focused_minutes">Focused minutes</option>
              <option value="sessions">Study sessions</option>
            </select>
          </label>
          <label>
            Target
            <input
              min="1"
              max="999"
              type="number"
              value={goal.target}
              onChange={(event) => update("target", Math.max(1, Number(event.target.value)))}
            />
          </label>
        </div>

        <div className="form-grid">
          <label>
            Period
            <select value={goal.period} onChange={(event) => update("period", event.target.value as GoalPeriod)}>
              <option value="day">Per day</option>
              <option value="week">Per week</option>
            </select>
          </label>
          <label>
            Consequences
            <select value={goal.strictness} onChange={(event) => update("strictness", event.target.value as Strictness)}>
              <option value="gentle">Gentle</option>
              <option value="standard">Standard</option>
              <option value="strict">Strict</option>
            </select>
          </label>
        </div>

        <button type="submit">{saved ? "Saved!" : "Save promise"}</button>
      </form>

      <footer>{view.state.totalAccepted} accepted · {Math.round(view.state.totalFocusSeconds / 60)} focused minutes</footer>
    </main>
  );

  function update<K extends keyof GoalConfiguration>(key: K, value: GoalConfiguration[K]) {
    setSaved(false);
    setGoal((current) => current ? { ...current, [key]: value } : current);
  }
}

function formatProgress(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

createRoot(document.getElementById("root")!).render(<App />);

