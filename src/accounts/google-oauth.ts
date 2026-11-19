import { browser } from "wxt/browser";
import type { AccountProfile, AccountState } from "./model";

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  picture?: string;
}

export class GoogleOAuthNotConfiguredError extends Error {
  constructor() {
    super("Google sign-in is not configured for this extension build yet.");
    this.name = "GoogleOAuthNotConfiguredError";
  }
}

export function isGoogleOAuthConfigured(): boolean {
  const oauth2 = browser.runtime.getManifest().oauth2;
  return Boolean(oauth2?.client_id && !oauth2.client_id.startsWith("your-"));
}

export async function signInWithGoogle(): Promise<AccountState> {
  if (!isGoogleOAuthConfigured()) throw new GoogleOAuthNotConfiguredError();

  const result = await browser.identity.getAuthToken({ interactive: true });
  if (!result.token) throw new Error("Google did not return an access token.");

  const profile = await fetchGoogleProfile(result.token);
  return {
    status: "signed_in",
    profile,
    signedInAt: new Date().toISOString(),
    syncStatus: "local_only",
  };
}

export async function signOutFromGoogle(): Promise<void> {
  if (!isGoogleOAuthConfigured()) return;
  try {
    const result = await browser.identity.getAuthToken({ interactive: false });
    if (result.token) await browser.identity.removeCachedAuthToken({ token: result.token });
  } catch {
    // Being unable to find a cached token still leaves the local sign-out valid.
  }
}

async function fetchGoogleProfile(token: string): Promise<AccountProfile> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await browser.identity.removeCachedAuthToken({ token });
    throw new Error("Google sign-in succeeded, but the profile could not be loaded.");
  }

  const user = (await response.json()) as GoogleUserInfo;
  if (!user.sub || !user.email) throw new Error("Google returned an incomplete profile.");

  return {
    id: user.sub,
    provider: "google",
    email: user.email,
    displayName: user.name || user.given_name || user.email.split("@")[0] || "LeetPet learner",
    avatarUrl: user.picture,
  };
}

