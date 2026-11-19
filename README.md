# LeetPet

LeetPet is a local-first Chrome extension that turns consistent LeetCode practice into the care and growth of a virtual companion.

## Current milestone

- Pet overlay on LeetCode problem pages
- Local activity detection for sessions, code runs, and submission results
- Permanent wisdom and temporary vitality progression
- Configurable streak, growth, and adaptive goal modes
- Recoverable consequences when a commitment is missed
- Extension popup for goals and progress
- Five-step onboarding for motivation, goals, privacy, and account choice
- Google OAuth account plumbing through Chrome Identity
- Event-sourced domain model with automated tests

AI hints and cloud synchronization are intentionally not part of this first local milestone. Google sign-in identifies the user locally; a backend exchange and synchronization service will be added separately.

## Google OAuth configuration

The extension uses Chrome's native Identity API. Copy `.env.example` to `.env.local`, then provide:

```text
WXT_GOOGLE_OAUTH_CLIENT_ID=...
WXT_EXTENSION_PUBLIC_KEY=...
```

The OAuth client must use Google's **Chrome Extension** application type and match the extension's stable Chrome Web Store item ID. The public key keeps the unpacked development build on that same extension ID.

Without these values, onboarding remains fully usable in local-only mode and clearly marks Google sign-in as awaiting configuration.

## Run locally

```bash
pnpm install
pnpm dev
```

WXT opens a development browser with the extension loaded. Navigate to a LeetCode problem page to see the pet.

To build an unpacked production extension:

```bash
pnpm build
```

Then load `.output/chrome-mv3` through `chrome://extensions` with Developer mode enabled.

## Verify

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Privacy boundary

Activity and progression remain in extension storage. LeetPet does not read LeetCode authentication cookies. Source code is not collected in this milestone.

