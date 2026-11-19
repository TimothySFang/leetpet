import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { defineContentScript } from "wxt/utils/define-content-script";
import type { StateView } from "../../src/domain/model";
import { extensionClient } from "../../src/extension/client";
import { LeetCodeAdapter } from "../../src/site-adapters/leetcode";
import { petEmoji, petMessage } from "../../src/ui/pet-copy";
import styles from "./style.css?inline";

function PetOverlay() {
  const [view, setView] = useState<StateView | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let active = true;
    const adapter = new LeetCodeAdapter();

    void extensionClient.getState().then((next) => active && setView(next));
    const stop = adapter.observeActivity((event) => {
      void extensionClient.record(event).then((next) => active && setView(next));
    });

    return () => {
      active = false;
      stop();
    };
  }, []);

  if (!view) return null;

  const progress = Math.min(100, (view.state.progress.value / view.state.goal.target) * 100);
  const progressLabel = `${formatProgress(view.state.progress.value)} / ${view.state.goal.target}`;

  if (collapsed) {
    return (
      <button className="pet-orb" type="button" onClick={() => setCollapsed(false)} aria-label="Open LeetPet">
        <span aria-hidden="true">{petEmoji(view)}</span>
      </button>
    );
  }

  return (
    <section className={`pet-card mood-${view.mood}`} aria-label="LeetPet companion">
      <button className="collapse" type="button" onClick={() => setCollapsed(true)} aria-label="Minimize LeetPet">
        −
      </button>
      <div className="pet-row">
        <div className="pet" aria-label={`${view.wisdomStage} pet`}>{petEmoji(view)}</div>
        <div>
          <div className="eyebrow">{view.wisdomStage} · {view.state.wisdomXp} wisdom</div>
          <p>{petMessage(view)}</p>
        </div>
      </div>
      <div className="meter-label">
        <span>Today’s promise</span>
        <strong>{progressLabel}</strong>
      </div>
      <div className="meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="stats">
        <span>🔥 {view.state.currentStreak} streak</span>
        <span>💚 {Math.round(view.state.vitality)} vitality</span>
      </div>
    </section>
  );
}

function formatProgress(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default defineContentScript({
  matches: ["https://leetcode.com/problems/*"],
  runAt: "document_idle",
  main() {
    const host = document.createElement("div");
    host.id = "leetpet-root";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = styles;
    const mount = document.createElement("div");
    shadow.append(style, mount);
    document.body.append(host);
    createRoot(mount).render(<PetOverlay />);
  },
});

