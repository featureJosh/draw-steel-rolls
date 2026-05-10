import { Combobox, ComboboxItem } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";

export type PF2ERollConfig =
    | {
          kind: "skill";
          skill: string;
          ability: string;
          fastForward?: boolean;
      }
    | {
          kind: "save";
          ability: string;
          fastForward?: boolean;
      }
    | {
          kind: "flat";
          fastForward?: boolean;
      };

export const Pf2eAdapter: GroupRollAdapter<PF2ERollConfig> = {
    getRollTypes() {
        //@ts-expect-error untyped
        const saves = Object.entries(CONFIG.PF2E.saves).map(
            ([saveId, data]) => ({
                id: `save:${saveId}`,
                //@ts-expect-error untyped
                label: `Saving Throw: ${game.i18n.localize(data)}`,
                config: {
                    kind: "save",
                    ability: saveId,
                } as PF2ERollConfig,
            })
        );

        //@ts-expect-error untyped
        const skills = Object.entries(CONFIG.PF2E.skills).map(
            ([skillId, data]) => {
                //@ts-expect-error untyped
                const { label, attribute } = data;
                const localizedLabel = game.i18n.localize(label);

                const abilityLabel =
                    //@ts-expect-error untyped
                    game.i18n.localize(CONFIG.PF2E.abilities[attribute]!);
                return {
                    id: `skill:${skillId}`,
                    label: `${localizedLabel} (${abilityLabel})`,
                    config: {
                        kind: "skill",
                        skill: skillId,
                        ability: attribute,
                    } as PF2ERollConfig,
                };
            }
        );
        const flat = {
            id: `flat`,
            label: `Flat Check`,
            config: { kind: "flat" },
        };
        return [...saves, ...skills, flat];
    },

    buildRequest(actor: Actor, config: PF2ERollConfig) {
        return {
            actorUuid: actor.uuid as ActorUuid,
            actor,
            roll: undefined,
            config,
            actorName: actor.name,
        };
    },

    async execute(
        request: PendingIndividualRollRequest & { config: PF2ERollConfig }
    ): Promise<Roll> {
        const { config } = request;

        let roll: Roll;

        if (config.kind === "save") {
            roll = await (request.actor as any).saves[config.ability].roll({
                skipDialog: true,
                createMessage: false,
            });
        } else if (config.kind === "skill") {
            roll = await (request.actor as any).skills[config.skill].roll({
                skipDialog: true,
                createMessage: false,
            });
        } else if (config.kind === "flat") {
            roll = await new Roll(`1d20`).evaluate();
        } else {
            throw new Error();
        }

        request.roll = roll;
        return roll;
    },

    renderRollTypeSelector(
        value: PF2ERollConfig | undefined,
        onChange: (cfg: PF2ERollConfig | undefined) => void
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
                <Combobox<PF2ERollConfig>
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
        if (config.kind === "save") {
            return `${config.ability.slice(0, 4).toUpperCase()} Save`;
        }
        if (config.kind === "skill") {
            const { skill, ability } = config;

            //@ts-expect-error untyped
            const skillTag = CONFIG.PF2E.skills[skill].label;
            const localizedSkill = game.i18n.localize(skillTag);

            const abilityLabel = `${ability.slice(0, 4).toUpperCase()}`;
            return `${localizedSkill} Check (${abilityLabel})`;
        }
        if (config.kind === "flat") {
            return `Flat Check`;
        }
        return "Unknown Roll";
    },
};

function getValueFromConfig(cfg: PF2ERollConfig): string {
    if (cfg.kind === "save") return `save:${cfg.ability}`;
    if (cfg.kind === "skill") return `skill:${cfg.skill}`;
    if (cfg.kind === "flat") return `flat`;
    return "";
}

let cachedItems: ComboboxItem<PF2ERollConfig>[] | null = null;

function getCachedItems(): ComboboxItem<PF2ERollConfig>[] {
    if (!cachedItems) {
        cachedItems = Pf2eAdapter.getRollTypes().map((t) => ({
            data: t.config,
            getValue: () => t.id,
            getLabel: () => t.label,
        }));
    }
    return cachedItems;
}
