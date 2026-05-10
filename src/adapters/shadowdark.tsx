import { Combobox, ComboboxItem } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";

export type SdRollConfig = {
    kind: "ability";
    ability: string; // 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
    fastForward?: boolean; // default true
};

export const ShadowdarkAdapter: GroupRollAdapter<SdRollConfig> = {
    getRollTypes() {
        const keys: string[] =
            // @ts-expect-error Foundry globals
            CONFIG.SHADOWDARK.ABILITY_KEYS ??
            // @ts-expect-error Foundry globals
            Object.keys(CONFIG.SHADOWDARK.ABILITIES_LONG ?? {});
        // @ts-expect-error Foundry globals
        const long = CONFIG.SHADOWDARK.ABILITIES_LONG ?? {};
        return keys.map((abilityId) => ({
            id: `ability:${abilityId}`,
            label: `Ability Check: ${
                long[abilityId] ?? abilityId.toUpperCase()
            }`,
            config: { kind: "ability", ability: abilityId } as SdRollConfig,
        }));
    },

    buildRequest(actor: Actor, config: SdRollConfig) {
        return {
            actorUuid: actor.uuid as ActorUuid,
            actor,
            roll: undefined,
            config,
            actorName: actor.name,
        };
    },

    async execute(
        request: PendingIndividualRollRequest & { config: SdRollConfig }
    ): Promise<Roll> {
        const { actor, config } = request;

        const abilityBonus = (actor as any).abilityModifier(config.ability);
        //@ts-expect-error untyped
        const roll: Roll = await new Roll("1d20 + @mod", {
            mod: abilityBonus,
        }).evaluate();

        request.roll = roll;
        return roll;
    },

    renderRollTypeSelector(
        value: SdRollConfig | undefined,
        onChange: (cfg: SdRollConfig | undefined) => void
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
                <Combobox<SdRollConfig>
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
        return `${config.ability.toUpperCase()} Check`;
    },
};

function getValueFromConfig(cfg: SdRollConfig): string {
    return `ability:${cfg.ability}`;
}

let cachedItems: ComboboxItem<SdRollConfig>[] | null = null;
function getCachedItems(): ComboboxItem<SdRollConfig>[] {
    if (!cachedItems) {
        cachedItems = ShadowdarkAdapter.getRollTypes().map((t) => ({
            data: t.config,
            getValue: () => t.id,
            getLabel: () => t.label,
        }));
    }
    return cachedItems;
}
