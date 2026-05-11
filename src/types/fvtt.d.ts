declare module "fvtt-types/configuration" {
    interface SettingConfig {
        "draw-steel-rolls.debugMode": boolean;
        "draw-steel-rolls.overlayEnabled": boolean;
        "draw-steel-rolls.background": string;
        "draw-steel-rolls.displayDurationMs": number;
        "draw-steel-rolls.setupLayout": "card" | "panel";
        "draw-steel-rolls.border-color": string | undefined;
    }

    namespace Hooks {
        interface HookConfig {
            "draw-steel-rolls.border-color": (
                value: string | undefined
            ) => void;
            "draw-steel-rolls.setupLayout": (value: "card" | "panel") => void;
        }
    }
}

export {};
