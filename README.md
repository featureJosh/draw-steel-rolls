<!-- docs:group:getting-started:start -->

# Aeris BG3 Rolls

**Aeris BG3 Rolls** adds a **cinematic group rolling system** to Foundry VTT, inspired by _Baldur’s Gate 3_.
Players see synchronized dice animations, overlays, and results, while the GM controls when and how group rolls occur.

This module is built on **Aeris Core** for UI and chat integration, and uses **Dice So Nice** for dice rendering.

### Features

-   **Group Roll Manager**: GMs can configure, edit, and trigger group rolls.
-   **Overlay UI**: Each player sees their actor’s dice roll animated on screen.
-   **Cinematic flow**: Highlighted “winning” die, animated modifiers, and result reveal.
-   **Persistence**: Group rolls are saved in world settings until resolved.
-   **Chat messages**: Nicely formatted roll results posted automatically to chat.

If you’d like to help fund future improvements, you can buy me a coffee - thank you for any support!

<a href='https://ko-fi.com/A0A41CU13I' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

---

<!-- docs:group:getting-started:end -->

## Feature Demo

![Feature Demo](examples/demo.mp4)

---

## API

You can manually trigger a custom group roll via the UI or module code using the `requestGroupRoll` helper.

---

<!-- docs:group:api-reference:start -->

### `aerisBg3Rolls.openGroupRollManager`

```js
aerisBg3Rolls.openGroupRollManager();
```

Opens the **Group Roll Manager** UI.
Group rolls created here are persisted to world settings.

It’s recommended to keep this call in a **macro** rather than wiring it to buttons in the regular UI, to avoid clutter.

---

### `aerisBg3Rolls.requestGroupRoll`

```ts
aerisBg3Rolls.requestGroupRoll(
  initiated: {
    id: string;
    status: "initiated";
    img?: string;
    promptHeader?: string;
    promptSubheader?: string;
    targetValue?: number;
    rollConfig?: any;
    rolls: {
      actor: Actor;
      roll: Roll.Evaluated<Roll>;
    }[];
  }
): Promise<Roll.Evaluated<Roll>[]>
```

High-level helper for executing a **Group Roll**.

-   Shows the group roll overlay for all players.
-   Returns the evaluated rolls (`Roll.Evaluated<Roll>`) for each actor, in order.
-   Dice animations are hidden after completion.

#### Returns

-   `Promise<Roll.Evaluated<Roll>[]>` — one evaluated roll per actor.

#### Example

```js
const actors = canvas.tokens.controlled.map((t) => t.actor).filter((a) => a);
if (!actors.length) {
    ui.notifications.warn("No tokens selected.");
    return;
}

// build initiated group roll
const initiated = {
    id: foundry.utils.randomID(),
    status: "initiated",
    promptHeader: "Dexterity Saving Throw",
    promptSubheader: "Collapsing bridge",
    img: "icons/skills/movement/feet-winged-boots-brown.webp",
    targetValue: 15,
    rolls: await Promise.all(
        actors.map(async (actor) => {
            const roll = await new Roll(
                "1d20 + @abilities.dex.mod",
                actor.getRollData()
            ).evaluate();
            return { actor, roll };
        })
    ),
};

// trigger the cinematic group roll
const result = await aerisBg3Rolls.requestGroupRoll(initiated);

console.log("Resolved rolls:", result);
```

---

<!-- docs:group:api-reference:end -->

## Installation

1. Copy the manifest URL: https://aeris-fvtt.gitlab.io/aeris-bg3-rolls/v13/module.json
2. Paste the manifest URL at the bottom of the install module interface in foundry. This can be found by:
    1. Opening FoundryVTT
    2. Navigating to the **"Add-On-Modules"** tab
    3. Clicking **"Install module"** at the top"
    4. The Manifest URL text box is at the bottom of the new window
3. Click **install**. Install any other dependencies that are required.
4. Open your world and activate the **Aeris BG3 Rolls** module.

---

## Compatibility

-   **Foundry VTT**: Version 13
-   **Systems Supported**:
    -   **DnD5e**: Version 5.x+
    -   **PF2e**: Version 7.x+
-   **Required Modules**:
    -   `socketlib`
    -   `Aeris Core`
    -   `Dice So Nice`
    -   `Color Picker`

---

### System Support

Group roll behavior (what kinds of rolls exist, how they are labeled, how they are executed) is **system-specific**.
Right now, the module only supports **DnD5e** and **PF2e** through the built-in adapters`.

If you would like support for a specific system, please reach out.

---

## Attribution

The two backgrounds videos (`roll_bg.webm` and `roll_bg_2.webm`) are sourced from:

-   [Plasma Smoke Toxic](https://pixabay.com/videos/plasma-smoke-toxic-animation-1470/)
-   [Stars Christmas Loop](https://pixabay.com/videos/stars-christmas-loop-glowing-light-183279/)
-   Licensed under the [Pixabay Content License](https://pixabay.com/service/license-summary/)
-   Free for commercial and non-commercial use, no attribution required (attribution given voluntarily)

The original files were converted to `.webm` format for use in this module.

---

## Development Setup

1. **Install dependencies**

    ```bash
    pnpm install
    ```

2. **Run in development mode**

    ```bash
    pnpm dev
    ```

    This will:

    - symlink the module into your Foundry `Data/modules` directory
    - start the Vite dev server

    By default, the symlink target is:

    - **Linux/macOS:** `~/.local/share/FoundryVTT/Data/modules`
    - **Windows:** `%LOCALAPPDATA%\FoundryVTT\Data\modules`

    If your Foundry installation uses a **different data path** (portable install, custom config, Docker volume, etc.), set the environment variable `FOUNDRY_MODULES_PATH` to point to the correct `Data/modules` directory before running:

    ```bash
    export FOUNDRY_MODULES_PATH=/path/to/FoundryData/modules
    pnpm dev
    ```

3. **Open FoundryVTT**
   Launch Foundry (default: [http://localhost:30001](http://localhost:30001)), enable **Aeris Core** in a world, and changes will hot-reload.

---

## Building

To create a production build and link it into Foundry:

```bash
pnpm build
```

Build artifacts go into `dist/` and are symlinked into your `Data/modules` directory (or the directory set by `FOUNDRY_MODULES_PATH`).

---

## Contributing

-   Fork the repo and create a feature branch.
-   Follow the setup steps above to get a local dev environment running.
-   Use the provided scripts:

    -   `pnpm dev` → symlink + dev server
    -   `pnpm build` → production build
    -   `pnpm lint` / `pnpm type-check` → code quality checks

-   Make sure your changes work both in dev and after a production build.
-   Open a PR with a clear description of your changes.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

If you encounter any issues or have feedback, feel free to reach out to me on **Discord**: `@robxnlifts`, or join my [discord server](https://discord.gg/gpHgGBxNSz) which has a specific channel for this module.
