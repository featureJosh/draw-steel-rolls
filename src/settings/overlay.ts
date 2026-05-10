import { MODULE_ID } from "@/config/constants";

export const DEFAULT_BACKGROUND = `/modules/${MODULE_ID}/assets/roll_bg_2.webm`;
export const MIN_OVERLAY_DURATION_MS = 3500;

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
        default: 6000,
        range: {
            min: MIN_OVERLAY_DURATION_MS,
            max: 15000,
            step: 500,
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
    if (!Number.isFinite(value)) return 6000;
    return Math.max(value, MIN_OVERLAY_DURATION_MS);
}
