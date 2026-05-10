declare module "fvtt-types/configuration" {
    interface SettingConfig {
        "aeris-bg3-rolls.debugMode": boolean;
        "aeris-bg3-rolls.imageOverrides": Record<string, string>;
        "aeris-bg3-rolls.groupRolls": object;
        "aeris-bg3-rolls.border-color": string | undefined;
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
            setRollForEveryone: (
                data: Serialized<SetRollForEveryoneArgs>
            ) => void;
            triggerRollForActor: (data: {
                groupRollId: GroupRollId;
                actorUuid: ActorUuid;
            }) => void;
            showGroupRollRequest: (data: InitiatedGroupRoll) => void;
            hideGroupRollRequest: () => void;
            "aeris-bg3-rolls.border-color": (value: string | undefined) => void;
        }
    }
}

export {};
