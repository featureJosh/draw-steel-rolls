declare global {
    type DrawSteelPowerRollType = "ability" | "test";

    interface DrawSteelPowerRollModifiers {
        edges?: number;
        banes?: number;
        bonuses?: number;
    }

    interface DrawSteelSkillConfig {
        label: string;
        group: string;
    }

    interface DrawSteelSkillGroupConfig {
        label: string;
    }

    interface DrawSteelPowerRollDialogContext {
        type?: DrawSteelPowerRollType;
        formula?: string;
        modifiers?: DrawSteelPowerRollModifiers;
        messageMode?: string;
        skill?: string;
        skills?: Set<string> | string[] | Record<string, unknown> | null;
        skillModifiers?:
            | Record<string, DrawSteelPowerRollModifiers>
            | Map<string, DrawSteelPowerRollModifiers>
            | null;
    }

    interface DrawSteelPowerRollDialogOptions {
        context?: DrawSteelPowerRollDialogContext | null;
        window?: {
            title?: string;
        };
    }

    interface DrawSteelPowerRollPromptValue {
        rolls: [Required<DrawSteelPowerRollModifiers>];
        skill: string | null;
        messageMode: string;
    }

    interface DrawSteelPowerRollDialogConstructor {
        create(options?: DrawSteelPowerRollDialogOptions): Promise<DrawSteelPowerRollPromptValue | null>;
    }

    interface DrawSteelPowerRollConstructor {
        new (...args: any[]): Roll;
        MAX_EDGE?: number;
        MAX_BANE?: number;
    }

    var ds:
        | {
              applications?: {
                  apps?: {
                      PowerRollDialog?: DrawSteelPowerRollDialogConstructor;
                  };
              };
              rolls?: {
                  PowerRoll?: DrawSteelPowerRollConstructor;
              };
              CONFIG?: {
                  characteristics?: Record<
                      string,
                      {
                          label: string;
                          hint: string;
                          rollKey: string;
                      }
                  >;
                  skills?: {
                      list?: Record<string, DrawSteelSkillConfig>;
                      groups?: Record<string, DrawSteelSkillGroupConfig>;
                  };
              };
              CONST?: {
                  testOutcomes?: Record<string, unknown>;
              };
          }
        | undefined;

    interface GlobalThis {
        ds: typeof ds;
    }
}

export {};
