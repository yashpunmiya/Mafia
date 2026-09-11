# MAFIA

A mobile-first 4-5 player social-deduction game for Decentraland Worlds, built for the 2026 Friendzone Buildathon.

Milestone 1 is a technical vertical slice: primitive Moonlit Village Council arena, lobby UI, public player registry, server-owned phase state, and targeted private-message proof. Real roles and game actions are deliberately deferred.

## Try it out

**With the Creator Hub (recommended)**

1. Install the [Creator Hub](https://decentraland.org/download/creator-hub), the official desktop app for creating, previewing, and publishing Decentraland scenes.
2. In the **Scenes** tab, import this scene's root folder.
3. Press **Preview** to launch the scene and its local Multiplayer Server.

**With the command line**

Inside this scene's root directory run:

```
npm install
npm run start
```

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

See `docs/ARCHITECTURE.md`, `docs/BUILD_STATUS.md`, `docs/TEST_PLAN.md`, and `docs/GAME_RULES.md` for the design, exact status, and required multi-client checks.

**With an AI coding assistant**

If you build with an AI coding assistant (Claude Code, Cursor, GitHub Copilot, and others), install the official Decentraland SDK Skills first. They teach your agent verified SDK7 patterns for every topic: scene creation, 3D models, interactivity, UI, multiplayer, deployment, and more.

```
npx skills add decentraland/sdk-skills
```

See [Vibe Coding with AI](https://docs.decentraland.org/creator/scenes-sdk7/getting-started/vibe-coding) for the official workflow guide.
