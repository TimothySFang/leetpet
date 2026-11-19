import { browser } from "wxt/browser";
import type { AccountState, OnboardingState } from "./model";
import { DEFAULT_ACCOUNT_STATE, DEFAULT_ONBOARDING_STATE } from "./model";

const ACCOUNT_KEY = "leetpet_account";
const ONBOARDING_KEY = "leetpet_onboarding";

export async function loadAccountState(): Promise<AccountState> {
  const stored = await browser.storage.local.get(ACCOUNT_KEY);
  return (stored[ACCOUNT_KEY] as AccountState | undefined) ?? DEFAULT_ACCOUNT_STATE;
}

export async function saveAccountState(account: AccountState): Promise<void> {
  await browser.storage.local.set({ [ACCOUNT_KEY]: account });
}

export async function loadOnboardingState(): Promise<OnboardingState> {
  const stored = await browser.storage.local.get(ONBOARDING_KEY);
  const onboarding = stored[ONBOARDING_KEY] as OnboardingState | undefined;
  return onboarding?.version === 1 ? onboarding : DEFAULT_ONBOARDING_STATE;
}

export async function saveOnboardingState(onboarding: OnboardingState): Promise<void> {
  await browser.storage.local.set({ [ONBOARDING_KEY]: onboarding });
}

