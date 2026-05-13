import { MODULE_ID } from "@/config/constants";

export const DEFAULT_BACKGROUND = `/modules/${MODULE_ID}/assets/roll_bg_2.webm`;
export const DEFAULT_OVERLAY_DURATION_MS = 6000;
export const MIN_OVERLAY_DURATION_MS = 3000;
export const DEFAULT_CLEAN_ROLL_CONFIGURATION_DIALOG = true;

export function registerOverlaySettings() {
    game.settings!.register(MODULE_ID, "background", {
        name: "Roll Overlay Background",
        hint: "Image or video path used behind native Draw Steel test rolls.",
        scope: "world",
        config: true,
        type: String,
        default: DEFAULT_BACKGROUND,
    });

    game.settings!.register(MODULE_ID, "displayDurationMs", {
        name: "Roll Overlay Duration",
        hint: "How long the overlay remains visible after animating a native Draw Steel test roll.",
        scope: "client",
        config: true,
        type: Number,
        default: DEFAULT_OVERLAY_DURATION_MS,
        range: {
            min: MIN_OVERLAY_DURATION_MS,
            max: 20000,
            step: 500,
        },
    });

    game.settings!.register(MODULE_ID, "cleanRollConfigurationDialog", {
        name: "Clean Roll Configuration Dialog",
        hint: "Remove the background, border, and shadow from the separate roll configuration panel.",
        scope: "client",
        config: true,
        type: Boolean,
        default: DEFAULT_CLEAN_ROLL_CONFIGURATION_DIALOG,
        onChange: (value) => {
            Hooks.call(
                `${MODULE_ID}.cleanRollConfigurationDialog`,
                Boolean(value)
            );
        },
    });
}

export function getOverlayBackground(): string {
    return String(game.settings!.get(MODULE_ID, "background") || DEFAULT_BACKGROUND);
}

export function getOverlayDisplayDuration(): number {
    const value = Number(game.settings!.get(MODULE_ID, "displayDurationMs"));
    if (!Number.isFinite(value)) return DEFAULT_OVERLAY_DURATION_MS;
    return Math.max(value, MIN_OVERLAY_DURATION_MS);
}

export function isCleanRollConfigurationDialogEnabled(): boolean {
    return Boolean(
        game.settings!.get(MODULE_ID, "cleanRollConfigurationDialog")
    );
}
