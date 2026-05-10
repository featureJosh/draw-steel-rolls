# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # install dependencies
pnpm dev              # symlink module into Foundry + start Vite dev server (HMR)
pnpm build            # production build → dist/ + symlink into Foundry
pnpm lint             # ESLint
pnpm type-check       # TypeScript check (no emit)
pnpm build:rc         # type-check + build + rsync to remote (requires .env with DEPLOY_HOST_ALIAS / DEPLOY_PATH)
```

Dev server proxies to Foundry on `localhost:30000`; Vite itself runs on port `30001`. If Foundry data lives in a non-default path, set `FOUNDRY_MODULES_PATH` before running `dev` or `build`.

## Architecture

This is a **Foundry VTT v13 module** (not a standalone web app). The `src/main.tsx` entry point hooks into Foundry's lifecycle (`init`, `setup`, `ready`) rather than mounting a normal SPA. Vite bundles it into `dist/main.bundle.js`, which Foundry loads via `module.json → esmodules`.

### Data flow for a group roll

1. **GM triggers** a roll via `aerisBg3Rolls.requestGroupRoll(initiated)` (public API in `src/api.ts` / `src/api/api.ts`).
2. **`src/listener/group-roll-listener.ts`** manages the GM-side promise lifecycle.
3. **`src/socket/_socket.ts`** registers `socketlib` handlers; `src/socket/trigger.ts` broadcasts events to all clients.
4. **Each client** receives `showGroupRollRequest` → `src/stores/group-roll-store.ts` (`setupGroupRollHooks`) spawns dice via `DiceBoxManager`, then sets state in `useRollStore` (Zustand).
5. **React overlay** (`src/components/roll-overlay/roll-overlay.tsx`, mounted in `<App>`) reads `useRollStore` and renders the cinematic UI. Results are revealed via `setRollForEveryone` socket event.
6. On completion, `hideGroupRollRequest` is broadcast and the listener resolves its promise.

### System adapters (`src/adapters/`)

Each supported system (`dnd`, `pf2e`, `shadowdark`) implements the `GroupRollAdapter<Cfg>` interface (`src/adapters/group-roll-adapter.d.ts`). `getAdapter()` picks the right one based on `game.system.id`. Adapters define:
- `getRollTypes()` — what roll types the system exposes in the Group Roll Manager
- `buildRequest()` / `execute()` — how rolls are constructed and evaluated
- `renderRollTypeSelector()` — system-specific React UI inside the editor

To add a new system: create a new file in `src/adapters/`, implement the interface, and register it in `src/adapters/get-adapter.ts`.

### Message parsers (`src/messageParsers/`)

Parse Foundry chat messages into a normalized format for display in the group roll chat component. One parser per system.

### Patches (`src/patches/`)

Override Foundry/system initiative hooks so group-roll initiative flows through this module's socket pipeline.

### Settings (`src/settings/`)

`_register-settings.ts` wires all Foundry world/client settings. Individual setting modules export typed getters/setters.

### UI components

- `src/components/roll-overlay/` — main cinematic overlay (dice canvas, player cards, info panel)
- `src/components/roll-manager/` — GM-facing Group Roll Manager and editor (React)
- `src/components/chat-message/` — chat card rendered via `aeris-core.registerChatComponents`
- `src/components/ui/` — shadcn/ui primitives (do not edit generated files)

### Key external dependencies

| Dep | Purpose |
|---|---|
| `socketlib` | Reliable GM↔client socket calls |
| `aeris-core` | Chat integration, docs registration, CSS import hook |
| `dice-so-nice` | 3D dice rendering (`DiceBoxManager` wraps its internal factory) |
| `color-picker` | Color settings UI |
| `zustand` | Client-side roll state |
| `gsap` + `framer-motion` | Animation |
| `three` | Direct Three.js mesh manipulation for dice materials |

### Path alias

`@/` resolves to `src/` (configured in `vite.config.mts` and `tsconfig.app.json`).

### Build notes

- `scripts/inject-id.js` post-processes `dist/module.json` to stamp the version.
- CSS is injected at runtime via the `aeris-core.import-css` hook (not a `<link>` tag in dev mode).
- Tailwind v4 is used via `@tailwindcss/vite`; styles are scoped under `.tw` in `App.tsx`.
