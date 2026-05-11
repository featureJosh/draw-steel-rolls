import { MODULE_ID } from "@/config/constants";

export const DEFAULT_BACKGROUND = `/modules/${MODULE_ID}/assets/roll_bg_2.webm`;
export const DEFAULT_OVERLAY_DURATION_MS = 9000;
export const MIN_OVERLAY_DURATION_MS = 7000;

export function registerOverlaySettings() {
    game.settings!.register(MODULE_ID, "overlayEnabled", {
        name: "Enable Draw Steel Roll Overlay",
        hint: "Show the cinematic overlay when native Draw Steel test rolls are posted to chat.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
    });

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

    game.settings!.register(MODULE_ID, "screenDiceEnabled", {
        name: "Allow Dice So Nice Screen Dice",
        hint: "Allow the native Dice So Nice chat-roll animation behind the cinematic overlay. When disabled, the module suppresses those screen dice and shows only the roll-box dice.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            Hooks.call(`${MODULE_ID}.screenDiceEnabled`, !!value);
        },
    });
}

export function isOverlayEnabled(): boolean {
    return !!game.settings!.get(MODULE_ID, "overlayEnabled");
}

export function getOverlayBackground(): string {
    return String(game.settings!.get(MODULE_ID, "background") || DEFAULT_BACKGROUND);
}

export function getOverlayDisplayDuration(): number {
    const value = Number(game.settings!.get(MODULE_ID, "displayDurationMs"));
    if (!Number.isFinite(value)) return DEFAULT_OVERLAY_DURATION_MS;
    return Math.max(value, MIN_OVERLAY_DURATION_MS);
}

export function isScreenDiceEnabled(): boolean {
    return !!game.settings!.get(MODULE_ID, "screenDiceEnabled");
}
