# Draw Steel Rolls

**Draw Steel Rolls** adds a cinematic overlay for native Draw Steel test rolls in Foundry VTT v14.

This module is intentionally a visual wrapper. Draw Steel owns the roll mechanics, Power Roll dialogs, `/test` enrichers, test request chat parts, hero-token rerolls, tiers, and outcome logic. This module listens for native Draw Steel test chat messages and renders an overlay from the `PowerRoll` data already produced by the system.

This project is derived from [aeris-bg3-rolls](https://gitlab.com/aeris-fvtt/aeris-bg3-rolls) on GitLab, a fork of that codebase, adapted for Draw Steel.

## Features

- Native Draw Steel test roll detection.
- Cinematic d10 overlay for characteristic tests.
- Total, natural result, tier, critical, edge, and bane display from native `PowerRoll` data.
- Hero-token reroll support through native Draw Steel chat message updates.
- Visual-only settings for overlay color, background, enable/disable, and duration.

## Compatibility

- **Foundry VTT**: v14.360+
- **System**: Draw Steel 1.0.0+
- **Required modules**:
  - `dice-so-nice`
  - `color-picker`

## Development

```bash
pnpm install
pnpm dev
pnpm type-check
pnpm lint
pnpm build
```

`pnpm dev` symlinks `dev/` into the Foundry module directory and starts Vite on port `30001`. Set `FOUNDRY_MODULES_PATH` if your Foundry data directory is not in the standard platform location.

## Attribution

### Fork lineage

Draw Steel Rolls builds on [aeris-bg3-rolls](https://gitlab.com/aeris-fvtt/aeris-bg3-rolls). See that repository for the original implementation and history.

### Media

The background videos (`roll_bg.webm` and `roll_bg_2.webm`) are sourced from:

- [Plasma Smoke Toxic](https://pixabay.com/videos/plasma-smoke-toxic-animation-1470/)
- [Stars Christmas Loop](https://pixabay.com/videos/stars-christmas-loop-glowing-light-183279/)
- Licensed under the [Pixabay Content License](https://pixabay.com/service/license-summary/)
