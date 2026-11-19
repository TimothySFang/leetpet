import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "LeetPet",
    description: "A learning companion that grows wiser as you practice LeetCode.",
    permissions: ["storage", "alarms"],
    host_permissions: ["https://leetcode.com/*"],
    action: {
      default_title: "LeetPet",
    },
  },
});

