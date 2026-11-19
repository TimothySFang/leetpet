import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { browser } from "wxt/browser";
import type { AccountView, OnboardingState } from "../../src/accounts/model";
import type {
  GoalConfiguration,
  GoalMetric,
  GoalMode,
  GoalPeriod,
  StateView,
  Strictness,
} from "../../src/domain/model";
import { extensionClient } from "../../src/extension/client";
import "./style.css";

const STEPS = ["Welcome", "Motivation", "Promise", "Account", "Ready"];
const DAYS = [
  [1, "M"], [2, "T"], [3, "W"], [4, "T"], [5, "F"], [6, "S"], [0, "S"],
] as const;

function OnboardingApp() {
  const [petView, setPetView] = useState<StateView | null>(null);
  const [accountView, setAccountView] = useState<AccountView | null>(null);
  const [goal, setGoal] = useState<GoalConfiguration | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([extensionClient.getState(), extensionClient.getAccount()])
      .then(([pet, account]) => {
        setPetView(pet);
        setGoal(pet.state.goal);
        setAccountView(account);
        setStep(account.onboarding.completedAt ? 4 : Math.min(account.onboarding.currentStep, 3));
      })
      .catch((cause: unknown) => setError(errorMessage(cause)));
  }, []);

  const modeCopy = useMemo(() => ({
    streak: "Give me a clear daily promise and make missed days matter.",
    growth: "Measure progress across the week and leave room for rest.",
    adaptive: "Let my companion balance challenge, review, and recovery.",
  }), []);

  if (!petView || !accountView || !goal) {
    return <main className="loading"><div className="loading-pet">🥚</div><p>{error || "Your companion is waking up…"}</p></main>;
  }

  async function moveTo(nextStep: number) {
    if (!goal || !accountView) return;
    setError("");
    setBusy(true);
    try {
      if (step === 2 && nextStep > step) {
        const nextPet = await extensionClient.updateGoal(goal);
        setPetView(nextPet);
        setGoal(nextPet.state.goal);
      }
      const onboarding: OnboardingState = {
        ...accountView.onboarding,
        currentStep: nextStep,
      };
      const nextAccount = await extensionClient.saveOnboarding(onboarding);
      setAccountView(nextAccount);
      setStep(nextStep);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function connectGoogle() {
    setError("");
    setBusy(true);
    try {
      const next = await extensionClient.signInWithGoogle();
      setAccountView(next);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function finish(accountChoice: "google" | "guest") {
    setBusy(true);
    try {
      const next = await extensionClient.completeOnboarding(accountChoice);
      setAccountView(next);
      setStep(4);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <aside className="companion-panel">
        <div className="brand"><span className="brand-mark">L</span><span>LeetPet</span></div>
        <div className={`pet-scene scene-${step}`} aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="egg"><span>⌁</span></div>
          <div className="spark spark-one">✦</div>
          <div className="spark spark-two">·</div>
        </div>
        <blockquote>{companionLine(step, goal.mode)}</blockquote>
        <p className="privacy-note"><span>●</span> Your practice stays on this device unless you choose to sync.</p>
      </aside>

      <section className="content-panel">
        <nav aria-label="Onboarding progress">
          {STEPS.map((label, index) => (
            <span key={label} className={index <= step ? "active" : ""} aria-label={`${label}${index === step ? ", current step" : ""}`} />
          ))}
          <small>{step + 1} of {STEPS.length}</small>
        </nav>

        <div className="step-content" aria-live="polite">
          {step === 0 && (
            <>
              <span className="eyebrow">A companion for deliberate practice</span>
              <h1>Meet the pet that grows when you do.</h1>
              <p className="lede">LeetPet turns thoughtful practice into a living record of your progress. It celebrates effort, remembers commitments, and never forgets what you have learned.</p>
              <div className="feature-row">
                <div><span>✦</span><strong>Grow wiser</strong><small>Permanent progress from real learning</small></div>
                <div><span>◒</span><strong>Build momentum</strong><small>Goals that fit the way you practice</small></div>
                <div><span>♡</span><strong>Stay human</strong><small>Rest and recovery are part of growth</small></div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <span className="eyebrow">Choose your relationship</span>
              <h1>How should your pet motivate you?</h1>
              <p className="lede">You can change this later. The promise should fit your life—not the other way around.</p>
              <div className="choice-stack">
                {(["streak", "growth", "adaptive"] as GoalMode[]).map((mode) => (
                  <button key={mode} type="button" className={`choice ${goal.mode === mode ? "selected" : ""}`} onClick={() => setGoal({ ...goal, mode })}>
                    <span className="choice-icon">{mode === "streak" ? "↗" : mode === "growth" ? "◔" : "✦"}</span>
                    <span><strong>{mode === "streak" ? "Protect a streak" : mode === "growth" ? "Grow at my pace" : "Let my pet adapt"}</strong><small>{modeCopy[mode]}</small></span>
                    <span className="radio" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <span className="eyebrow">Make a fair promise</span>
              <h1>What does showing up look like?</h1>
              <p className="lede">Start a little smaller than your ambition. Consistency should feel achievable.</p>
              <div className="promise-grid">
                <label>Measure
                  <select value={goal.metric} onChange={(event) => updateGoal("metric", event.target.value as GoalMetric)}>
                    <option value="accepted_problems">Accepted problems</option>
                    <option value="focused_minutes">Focused minutes</option>
                    <option value="sessions">Study sessions</option>
                  </select>
                </label>
                <label>Target
                  <input type="number" min="1" max="999" value={goal.target} onChange={(event) => updateGoal("target", Math.max(1, Number(event.target.value)))} />
                </label>
                <label>Period
                  <select value={goal.period} onChange={(event) => updateGoal("period", event.target.value as GoalPeriod)}>
                    <option value="day">Each day</option>
                    <option value="week">Each week</option>
                  </select>
                </label>
                <label>Accountability
                  <select value={goal.strictness} onChange={(event) => updateGoal("strictness", event.target.value as Strictness)}>
                    <option value="gentle">Gentle</option>
                    <option value="standard">Standard</option>
                    <option value="strict">Strict</option>
                  </select>
                </label>
              </div>
              <div className="days-field">
                <strong>Practice days</strong><small>Your pet only expects you on the days you choose.</small>
                <div className="days">
                  {DAYS.map(([day, label], index) => (
                    <button key={`${day}-${index}`} type="button" className={goal.committedDays.includes(day) ? "selected" : ""} onClick={() => toggleDay(day)}>{label}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <span className="eyebrow">Keep your journey safe</span>
              <h1>Take your progress with you.</h1>
              <p className="lede">A Google account will identify your LeetPet when cloud sync arrives. You can also begin locally and connect later.</p>
              {accountView.account.status === "signed_in" ? (
                <div className="account-card">
                  {accountView.account.profile?.avatarUrl ? <img src={accountView.account.profile.avatarUrl} alt="" /> : <span className="avatar">✓</span>}
                  <span><strong>{accountView.account.profile?.displayName}</strong><small>{accountView.account.profile?.email}</small></span>
                  <span className="connected">Connected</span>
                </div>
              ) : (
                <button className="google-button" type="button" disabled={!accountView.googleOAuthConfigured || busy} onClick={connectGoogle}>
                  <span className="google-g">G</span> Continue with Google
                </button>
              )}
              {!accountView.googleOAuthConfigured && <p className="setup-note">Google sign-in is ready in code and will activate once the extension’s OAuth client ID is configured.</p>}
              <div className="trust-list">
                <span>✓ We never read your LeetCode password or cookies.</span>
                <span>✓ Your source code is not uploaded in this version.</span>
                <span>✓ You can use LeetPet without creating an account.</span>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <span className="eyebrow">Your journey begins</span>
              <h1>Your companion is ready.</h1>
              <p className="lede">Open any LeetCode problem. Your pet will notice focused time, attempts, and accepted solutions while your wisdom grows permanently.</p>
              <div className="ready-card">
                <span className="ready-pet">🥚</span>
                <span><strong>Hatchling · 0 wisdom</strong><small>{goal.target} {goal.metric.replaceAll("_", " ")} per {goal.period}</small></span>
              </div>
              <button className="primary large" type="button" onClick={() => void browser.tabs.create({ url: "https://leetcode.com/problemset/" })}>Open LeetCode</button>
              <button className="text-button" type="button" onClick={() => window.close()}>I’ll practice later</button>
            </>
          )}
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        {step < 4 && (
          <footer>
            <button className="back" type="button" disabled={step === 0 || busy} onClick={() => void moveTo(step - 1)}>Back</button>
            {step === 3 ? (
              <div className="footer-actions">
                <button className="secondary" type="button" disabled={busy} onClick={() => void finish("guest")}>Continue locally</button>
                <button className="primary" type="button" disabled={busy || accountView.account.status !== "signed_in"} onClick={() => void finish("google")}>Finish setup</button>
              </div>
            ) : (
              <button className="primary" type="button" disabled={busy || (step === 2 && goal.committedDays.length === 0)} onClick={() => void moveTo(step + 1)}>{step === 0 ? "Meet my pet" : "Continue"}</button>
            )}
          </footer>
        )}
      </section>
    </main>
  );

  function updateGoal<K extends keyof GoalConfiguration>(key: K, value: GoalConfiguration[K]) {
    setGoal((current) => current ? { ...current, [key]: value } : current);
  }

  function toggleDay(day: number) {
    setGoal((current) => {
      if (!current) return current;
      const selected = current.committedDays.includes(day);
      return {
        ...current,
        committedDays: selected
          ? current.committedDays.filter((value) => value !== day)
          : [...current.committedDays, day].sort(),
      };
    });
  }
}

function companionLine(step: number, mode: GoalMode): string {
  if (step === 1) return mode === "streak" ? "I’ll help protect the promises you make." : "We can grow without rushing.";
  if (step === 2) return "A small honest promise is stronger than a heroic plan.";
  if (step === 3) return "Your learning belongs to you.";
  if (step === 4) return "Let’s become wiser together.";
  return "I don’t need perfection. I just want to learn beside you.";
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

createRoot(document.getElementById("root")!).render(<OnboardingApp />);

