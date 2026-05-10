# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Commands

```bash
pnpm install          # install dependencies
pnpm dev              # symlink dev/ into Foundry + start Vite dev server
pnpm build            # production build -> dist/ + symlink into Foundry
pnpm lint             # ESLint
pnpm type-check       # TypeScript check, no emit
pnpm build:rc         # type-check + build + rsync to remote, requires .env
```

Dev server proxies to Foundry on `localhost:30000`; Vite runs on port `30001`. If Foundry data lives in a non-default path, set `FOUNDRY_MODULES_PATH` before running `dev` or `build`.

## Architecture

This is a Foundry VTT v14 module for the `draw-steel` system only. It is not a standalone web app and it does not create or execute Draw Steel rolls.

The module is a passive visual wrapper:

1. `src/main.tsx` registers settings on `init`, mounts the React overlay on `ready`, and registers the Draw Steel chat listener.
2. `src/listener/draw-steel-roll-listener.ts` listens to native `createChatMessage` and `updateChatMessage` hooks.
3. The listener accepts only visible Draw Steel `standard` chat messages with `system.parts` entries of `type === "test"` and a latest evaluated native `ds.rolls.PowerRoll`.
4. Native roll data is copied into `DrawSteelRollOverlayData`: d10 results, total, natural result, tier/product, net boon, critical flags, and speaker actor presentation.
5. `src/stores/roll-overlay-store.ts` queues overlay requests and spawns Dice So Nice d10 meshes through `DiceBoxManager`.
6. `src/components/roll-overlay/` renders the cinematic overlay from that native view data.

Draw Steel owns mechanics, dialogs, `/test` enrichers, test request chat buttons, hero-token rerolls, tiers, and outcome logic. Do not add custom roll execution unless Draw Steel has no native workflow for the feature.

## Settings

`src/settings/_register-settings.ts` wires settings. Keep settings visual or diagnostic only:

- `debugMode`
- `overlayEnabled`
- `background`
- `displayDurationMs`
- `border-color`

## Key Files

- `module.json` and `dev/module.json`: Foundry manifest identity, v14 compatibility, Draw Steel-only relationship.
- `src/listener/draw-steel-roll-listener.ts`: native chat message detection and extraction.
- `src/stores/roll-overlay-store.ts`: queued overlay lifecycle and d10 mesh spawning.
- `src/managers/dice-box-manager.ts`: Dice So Nice mesh wrapper.
- `src/utils/dsn.ts`: Dice So Nice helpers and face-up quaternions.
- `src/components/roll-overlay/`: React overlay components.
- `src/types/draw-steel.d.ts` and `src/types/fvtt.d.ts`: local type augmentation for Foundry and Draw Steel globals.

## Dependencies

| Dep | Purpose |
|---|---|
| `dice-so-nice` | Required Foundry module for 3D dice rendering |
| `color-picker` | Foundry settings color field |
| `zustand` | Overlay state |
| `gsap` | Overlay and dice animation |
| `three` | Direct dice mesh manipulation |
| `react` / `react-dom` | Overlay UI |
| `@tailwindcss/vite` / `tailwindcss` | Scoped overlay styling |

There is intentionally no `socketlib`, `aeris-core`, system adapter layer, custom group-roll manager, or custom chat card.

## Build Notes

- `scripts/inject-id.js` post-processes `dist/module.json` to stamp the module id.
- CSS is emitted by Vite and loaded through the manifest `styles` entry.
- Tailwind v4 styles are scoped under `.tw` in `src/App.tsx`.
- `@/` resolves to `src/`.
