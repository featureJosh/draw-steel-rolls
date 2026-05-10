# Draw Steel Rolls

**Draw Steel Rolls** adds a cinematic overlay for native Draw Steel test rolls in Foundry VTT v14.

This module is intentionally a visual wrapper. Draw Steel owns the roll mechanics, Power Roll dialogs, `/test` enrichers, test request chat parts, hero-token rerolls, tiers, and outcome logic. This module listens for native Draw Steel test chat messages and renders an overlay from the `PowerRoll` data already produced by the system.

## Features

- Native Draw Steel test roll detection.
- Cinematic d10 overlay for characteristic tests.
- Total, natural result, tier, critical, edge, and bane display from native `PowerRoll` data.
- Hero-token reroll support through native Draw Steel chat message updates.
- Visual-only settings for overlay color, background, enable/disable, and duration.

## Usage

Use Draw Steel normally:

```text
/test might
/test R easy
/test I hard
/test I edges=1 banes=1
```

You can also roll tests from actor sheets or native Draw Steel test request chat buttons. When Draw Steel posts a visible native test roll, this module animates it.

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

The background videos (`roll_bg.webm` and `roll_bg_2.webm`) are sourced from:

- [Plasma Smoke Toxic](https://pixabay.com/videos/plasma-smoke-toxic-animation-1470/)
- [Stars Christmas Loop](https://pixabay.com/videos/stars-christmas-loop-glowing-light-183279/)
- Licensed under the [Pixabay Content License](https://pixabay.com/service/license-summary/)
