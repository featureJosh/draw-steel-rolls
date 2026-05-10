import { Combobox, ComboboxItem } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";

export type Dnd5eRollConfig =
    | {
          kind: "ability";
          ability: string;
          fastForward?: boolean;
      }
    | {
          kind: "save";
          ability: string;
          fastForward?: boolean;
      }
    | {
          kind: "skill";
          skill: string;
          ability: string;
          fastForward?: boolean;
      };

export const Dnd5eAdapter: GroupRollAdapter<Dnd5eRollConfig> = {
    getRollTypes() {
        //@ts-expect-error untyped
        const abilities = Object.entries(CONFIG.DND5E.abilities).map(
            ([abilityId, data]) => ({
                id: `ability:${abilityId}`,
                //@ts-expect-error untyped
                label: `Ability Check: ${data.label}`,
                config: {
                    kind: "ability",
                    ability: abilityId,
                } as Dnd5eRollConfig,
            })
        );

        //@ts-expect-error untyped
        const saves = Object.entries(CONFIG.DND5E.abilities).map(
            ([abilityId, data]) => ({
                id: `save:${abilityId}`,
                //@ts-expect-error untyped
                label: `Saving Throw: ${data.label}`,
                config: {
                    kind: "save",
                    ability: abilityId,
                } as Dnd5eRollConfig,
            })
        );

        //@ts-expect-error untyped
        const skills = Object.entries(CONFIG.DND5E.skills).map(
            ([skillId, data]) => {
                //@ts-expect-error untyped
                const abilityId = data.ability;
                const abilityLabel =
                    //@ts-expect-error untyped
                    CONFIG.DND5E.abilities[abilityId]?.label ?? "";
                return {
                    id: `skill:${skillId}`,
                    //@ts-expect-error untyped
                    label: `${data.label} (${abilityLabel})`,
                    config: {
                        kind: "skill",
                        skill: skillId,
                        ability: abilityId,
                    } as Dnd5eRollConfig,
                };
            }
        );
        return [...abilities, ...saves, ...skills];
    },

    buildRequest(actor: Actor, config: Dnd5eRollConfig) {
        return {
            actorUuid: actor.uuid as ActorUuid,
            actor,
            roll: undefined,
            config,
            actorName: actor.name,
        };
    },

    async execute(
        request: PendingIndividualRollRequest & { config: Dnd5eRollConfig }
    ): Promise<Roll> {
        const { config } = request;

        let rolls: Roll[];

        if (config.kind === "ability") {
            rolls = await (request.actor as any).rollAbilityCheck(
                { ability: config.ability },
                { configure: false },
                { create: false }
            );
        } else if (config.kind === "save") {
            rolls = await (request.actor as any).rollSavingThrow(
                { ability: config.ability },
                { configure: false },
                { create: false }
            );
        } else if (config.kind === "skill") {
            rolls = await (request.actor as any).rollSkill(
                {
                    skill: config.skill,
                    ability: config.ability,
                },
                { configure: false },
                { create: false }
            );
        } else {
            throw new Error();
        }

        const roll = rolls[0];

        request.roll = roll;
        return roll;
    },

    renderRollTypeSelector(
        value: Dnd5eRollConfig | undefined,
        onChange: (cfg: Dnd5eRollConfig | undefined) => void
    ): React.ReactNode {
        const items = getCachedItems();

        const selectedItem = value
            ? items.find(
                  (it) => it.getValue(it.data) === getValueFromConfig(value)
              )?.data
            : undefined;

        return (
            <div className="space-y-2">
                <Label htmlFor="roll-type">Roll Type *</Label>
                <Combobox<Dnd5eRollConfig>
                    items={items}
                    value={selectedItem}
                    onValueChange={onChange}
                    placeholder="Select roll type"
                    className="w-full"
                />
            </div>
        );
    },

    getLabel(config) {
        if (config.kind === "ability") {
            return `${
                //@ts-expect-error untyped
                CONFIG.DND5E.abilities[
                    config.ability
                ]?.abbreviation?.toUpperCase() ?? config.ability
            } Check`;
        }
        if (config.kind === "save") {
            return `${
                //@ts-expect-error untyped
                CONFIG.DND5E.abilities[
                    config.ability
                ]?.abbreviation?.toUpperCase() ?? config.ability
            } Save`;
        }
        if (config.kind === "skill") {
            const skillLabel =
                //@ts-expect-error untyped
                CONFIG.DND5E.skills[config.skill]?.label ?? config.skill;
            const abilityLabel =
                //@ts-expect-error untyped
                CONFIG.DND5E.abilities[
                    config.ability
                ]?.abbreviation.toUpperCase() ?? config.ability;
            return `${skillLabel} Check (${abilityLabel})`;
        }
        return "Unknown Roll";
    },
};

function getValueFromConfig(cfg: Dnd5eRollConfig): string {
    if (cfg.kind === "ability") return `ability:${cfg.ability}`;
    if (cfg.kind === "save") return `save:${cfg.ability}`;
    if (cfg.kind === "skill") return `skill:${cfg.skill}`;
    return "";
}

let cachedItems: ComboboxItem<Dnd5eRollConfig>[] | null = null;

function getCachedItems(): ComboboxItem<Dnd5eRollConfig>[] {
    if (!cachedItems) {
        cachedItems = Dnd5eAdapter.getRollTypes().map((t) => ({
            data: t.config,
            getValue: () => t.id,
            getLabel: () => t.label,
        }));
    }
    return cachedItems;
}
