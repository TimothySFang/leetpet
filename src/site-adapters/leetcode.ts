import type {
  ActivityEvent,
  Difficulty,
  ProblemMetadata,
  SubmissionResult,
} from "../domain/model";

const RESULT_PATTERNS: Array<[RegExp, SubmissionResult]> = [
  [/\bAccepted\b/i, "accepted"],
  [/\bWrong Answer\b/i, "wrong_answer"],
  [/\bRuntime Error\b/i, "runtime_error"],
  [/\bTime Limit Exceeded\b/i, "timeout"],
];

function makeEventBase() {
  return {
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

function problemSlug(): string | null {
  return location.pathname.match(/^\/problems\/([^/]+)/)?.[1] ?? null;
}

function detectDifficulty(): Difficulty {
  const visibleText = document.body.innerText.slice(0, 20_000);
  if (/\bHard\b/.test(visibleText)) return "hard";
  if (/\bMedium\b/.test(visibleText)) return "medium";
  return "easy";
}

export class LeetCodeAdapter {
  private stopFunctions: Array<() => void> = [];
  private lastResultSignature = "";
  private activeProblem = problemSlug();

  detectProblem(): ProblemMetadata | null {
    const id = problemSlug();
    if (!id) return null;
    const heading = document.querySelector<HTMLElement>("h1, [data-cy='question-title']");
    return {
      id,
      title: heading?.innerText.trim() || id.replaceAll("-", " "),
      difficulty: detectDifficulty(),
    };
  }

  observeActivity(emit: (event: ActivityEvent) => void): () => void {
    const startSession = () => {
      const problem = this.detectProblem();
      if (!problem) return;
      emit({ ...makeEventBase(), type: "SESSION_STARTED", problemId: problem.id });
    };

    startSession();

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("button") : null;
      const label = target?.textContent?.trim() ?? "";
      const problem = this.detectProblem();
      if (!problem || !/^(Run|Submit)$/i.test(label)) return;
      emit({ ...makeEventBase(), type: "CODE_RUN", problemId: problem.id });
    };
    document.addEventListener("click", onClick, true);
    this.stopFunctions.push(() => document.removeEventListener("click", onClick, true));

    const observer = new MutationObserver((records) => {
      const problem = this.detectProblem();
      if (!problem) return;

      for (const record of records) {
        for (const node of record.addedNodes) {
          const text = node.textContent?.trim();
          if (!text || text.length > 1_000) continue;
          const match = RESULT_PATTERNS.find(([pattern]) => pattern.test(text));
          if (!match) continue;

          const signature = `${problem.id}:${match[1]}:${text}`;
          if (signature === this.lastResultSignature) return;
          this.lastResultSignature = signature;
          emit({
            ...makeEventBase(),
            type: "SUBMISSION_RECORDED",
            problemId: problem.id,
            result: match[1],
            difficulty: problem.difficulty,
          });
          return;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    this.stopFunctions.push(() => observer.disconnect());

    const focusTimer = window.setInterval(() => {
      const problem = this.detectProblem();
      if (!problem || document.visibilityState !== "visible" || !document.hasFocus()) return;
      emit({
        ...makeEventBase(),
        type: "FOCUS_RECORDED",
        problemId: problem.id,
        seconds: 60,
      });
    }, 60_000);
    this.stopFunctions.push(() => window.clearInterval(focusTimer));

    const routeTimer = window.setInterval(() => {
      const nextProblem = problemSlug();
      if (nextProblem && nextProblem !== this.activeProblem) {
        this.activeProblem = nextProblem;
        this.lastResultSignature = "";
        startSession();
      }
    }, 1_000);
    this.stopFunctions.push(() => window.clearInterval(routeTimer));

    return () => {
      for (const stop of this.stopFunctions.splice(0)) stop();
    };
  }
}

