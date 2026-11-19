export type AccountStatus = "signed_out" | "signed_in";
export type AccountProvider = "google";

export interface AccountProfile {
  id: string;
  provider: AccountProvider;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface AccountState {
  status: AccountStatus;
  profile?: AccountProfile;
  signedInAt?: string;
  syncStatus: "local_only" | "ready";
}

export interface OnboardingState {
  version: 1;
  completedAt?: string;
  currentStep: number;
  accountChoice?: "google" | "guest";
}

export interface AccountView {
  account: AccountState;
  onboarding: OnboardingState;
  googleOAuthConfigured: boolean;
}

export const DEFAULT_ACCOUNT_STATE: AccountState = {
  status: "signed_out",
  syncStatus: "local_only",
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  version: 1,
  currentStep: 0,
};

