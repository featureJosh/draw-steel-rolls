declare module "fvtt-types/configuration" {
    interface SettingConfig {
        "draw-steel-rolls.overlayEnabled": boolean;
        "draw-steel-rolls.background": string;
        "draw-steel-rolls.displayDurationMs": number;
        "draw-steel-rolls.border-color": string | undefined;
    }

    namespace Hooks {
        interface HookConfig {
            diceSoNiceRollStart: (
                id: string,
                config: { roll: Roll; user: User; users: null; blind: boolean }
            ) => void;
            diceSoNiceMessageProcessed: (
                chatMessageId: string,
                config: { willTrigger3DRoll: boolean }
            ) => void;
            "draw-steel-rolls.border-color": (
                value: string | undefined
            ) => void;
        }
    }
}

export {};
