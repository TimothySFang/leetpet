import { defineConfig } from "wxt";

const googleOAuthClientId = process.env.WXT_GOOGLE_OAUTH_CLIENT_ID?.trim();
const extensionPublicKey = process.env.WXT_EXTENSION_PUBLIC_KEY?.trim();

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "LeetPet",
    description: "A learning companion that grows wiser as you practice LeetCode.",
    permissions: ["storage", "alarms", "identity"],
    host_permissions: ["https://leetcode.com/*", "https://www.googleapis.com/*"],
    action: {
      default_title: "LeetPet",
    },
    ...(googleOAuthClientId
      ? {
          oauth2: {
            client_id: googleOAuthClientId,
            scopes: ["openid", "email", "profile"],
          },
        }
      : {}),
    ...(extensionPublicKey ? { key: extensionPublicKey } : {}),
  },
});

